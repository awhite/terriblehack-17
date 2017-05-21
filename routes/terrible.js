const MongoClient	= require('mongodb').MongoClient,
	nodemailer		= require('nodemailer'),
	schedule		= require('node-schedule'),
	router			= require('express').Router(),
	co				= require('co');

const feridunEmail	= 'totallyferidun@gmail.com',
	mongoUrl		= 'mongodb://127.0.0.1:27017/terrible',
	transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'heloiemdrek@gmail.com',
			pass: 'tonyischinese'
		}
	});


router.post('/terrible/subscribe', (req, res) => {
	console.log(req.body);
	// check request fields
	if (req.body.email && req.body.name && req.body.courses) {
		co(function*() {
			let db = yield MongoClient.connect(mongoUrl);
			console.log('Database connection established');
			let doc = yield db.collection('users').findOne({ email: req.body.email });
			if (doc) { // if user in database already
				res.send('exists');
			} else {
				// create user
				let user = {};
				user.name = req.body.name;
				user.email = req.body.email;
				user.courses = req.body.courses;
				user.verified = false;
				user.verificationCode = generateRandomString(64);
				yield db.collection('users').insertOne(user);
				let created = yield db.collection('users').findOne({ email: user.email });
				console.log(created);
				yield db.collection('users').updateOne({ email: user.email }, { $set: { id: created._id.valueOf() } });
				console.log('user created');

				// send verification email
				let url = `http://alwhite-me.herokuapp.com/terrible/verify?id=${user.id}&verificationCode=${user.verificationCode}`;
				let mailOptions = {
					from: '"John Dongle" <heloiemdrek@gmail.com>',
					to: user.email,
					subject: 'verify pls',
					text: url,
					html: `<a href="${url}">k</a>`
				};
				try {
					yield transporter.sendMail(mailOptions);
				} catch (err) {
					console.log(err);
					yield db.collection('users').deleteOne({ email: user.email });
				}
			}
			db.close();
		}).catch(onError);
	}
});

router.get('/terrible/verify', (req, res) => {
	console.log('verify endpoint hit');
	let id = req.query.id;
	let verificationCode = req.query.verificationCode;
	co(function*() {
		let db = yield MongoClient.connect(mongoUrl);
		let doc = yield db.collection('users').findOne({ id: id });
		console.log('codes:', doc.verificationCode, verificationCode);
		if (doc) {
			if (doc.verificationCode === verificationCode) {
				yield db.collection('users').updateOne({ id: id }, { $set: { verified: true } });
				res.send('dope');
			}
		}
		db.close();
	}).catch(onError);
});

router.get('/terrible/respond', (req, res) => {
	let id = req.query.id;
	let response = req.query.inclass;
	if (response === 'yes') {
		res.send('<img src="http://alwhite-me.herokuapp.com/terrible/happy.jpg">');
	} else if (response === 'no') {
		co(function*() {
			let db = yield MongoClient.connect(mongoUrl);
			let doc = yield db.collection('users').findOne({ id: id });
			let name = doc.name;
			let course = req.query.class;
			let mailOptions = {
				from: `${name} <heloiemdrek@gmail.com>`,
				to: feridunEmail,
				subject: 'sorry :(',
				text: `Dear President Hamdullahpur,\nI regret to inform you that I, ${name}, am not in my scheduled ${course} class at the moment.\n\nRegards,\n`
			};
			transporter.sendMail(mailOptions);
			db.close();
		}).catch(onError);
	}
});

router.get('/terrible/test', (req, res) => {
	check(1, 9, 0);
	res.send('kewl');
	res.end();
});

let hour = 8;
while (hour < 22) {
	for (let day = 1; day < 6; day++) {
		schedule.scheduleJob(`0 ${hour} * * ${day}`, function() {
			check(day, hour, 0);
		});
		schedule.scheduleJob(`30 ${hour} * * ${day}`, function() {
			check(day, hour, 30);
		});
	}
	hour++;
}

function check(day, hours, minutes) {
	console.log('checking');
	co(function*() {
		let db = yield MongoClient.connect(mongoUrl);
		db.collection('users').find({ 'courses': { $elemMatch: { days: ''+day, start: [''+hours, ''+minutes] } } }).forEach((doc) => {
			console.log('sending', doc);
			send(doc, day, hours, minutes);
		});
		db.close();
	}).catch(onError);
}

function send(doc, day, hours, minutes) {
	let course = getClass(doc.courses, day, hours, minutes);
	let mailOptions = {
		from: '"John Dongle" <heloiemdrek@gmail.com>',
		to: doc.email,
		subject: `are  you at ${course}?`,
		html: `
		<img src="http://alwhite-me.herokuapp.com/terrible/sad.png" style="width: 300px; height: auto;">
		<p>Hi ${doc.name.toUpperCase()}. please let me know if you are in ${course} class now.?</p>
		<a href="http://alwhite-me.herokuapp.com/terrible/respond?inclass=yes&id=${doc.id}&class=${course}">heck yes bb</a><br>
		<a href="http://alwhite-me.herokuapp.com/terrible/respond?inclass=no&id=${doc.id}&class=${course}">no :( i am sorry to have failed you</a>`
	};
	console.log(mailOptions);
	transporter.sendMail(mailOptions);
}

function getClass(classes, day, hours, minutes) {
	console.log(classes);
	for (let i = 0; i < classes.length; i++) {
		let course = classes[i];
		if (course.days.indexOf(day) !== -1 && course.start === [''+hours, ''+minutes]) {
			return course.name;
		}
	}
}

function onError(err) {
	console.log(err);
}

function generateRandomString (length) {
	let text = '';
	let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYzabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = router;