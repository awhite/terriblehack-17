$(function(){

	var courseCount = 0;
	var template = $('#hidden-template').html();

	$('#addCourse').on('click',  function(event) {
		if(courseCount <= 7){
			courseCount++;	
			var item = $(template).clone();
			$('#form').append(item);
			
			if(courseCount == 7){
				$('#addCourse').prop('disabled', true);
			}
		} 
	});

	$('#form').on('click', '.remove', function(event) {
		$(event.target).parent().parent().remove();
		courseCount--;
		if(courseCount <= 7){
			$('#addCourse').prop('disabled', false);
		}
	});

	$('#submitCourses').on('click', function(event) {
		$('#errorMsg').remove();

		var stuName = $('#nameInput').val();
		var stuEmail = $('#emailInput').val();

		if(!stuName || !stuEmail){
			$('#messages').append("<p id=\"errorMsg\">you didnt fill everything out &#9785;</p>");
			return;
		}

		if(courseCount == 0){
			$('#messages').append("<p id=\"errorMsg\">you didnt add any courses &#9785;</p>");
			return;
		}

		var courses = getCourseArray();

		if(courses == 0){
			$('#messages').append("<p id=\"errorMsg\">you didnt fill everything out &#9785;</p>");
			return;
		}

		stuName = stuName.trim();
		stuEmail = stuEmail.trim();

		var thisStudent = new student(stuName, courses, stuEmail);

		$.ajax({
			type: "POST",
			url: 'http://alwhite.me/terrible/subscribe',
			data: JSON.stringify(thisStudent),
			success: function(data){
				$('#form').prepend("<p>" + data + "</p>");
			},
			contentType: "application/json",
			dataType: 'json'
		});

		courseCount = 0;
		$('.container').empty();
		$('.container').append("<p style=\"margin-top: 50px\">check your e mail</p>");
	});

	function student(name, courses, email) {
		this.name = name;
		this.courses = courses;
		this.email = email;
	}

	function course(name, days, start){
		this.name = name;
		this.days = days;
		this.start = start;
	}

	function getCourseArray(){
		var courseArray = [];
		
		$('.course').each(function(index, el) {
			var courseName = $(this).find('.courseNameInput').val();
			courseName = courseName.trim();
			var courseDays = $(this).find('.daySelect').find("option:selected").val();
			courseDays = courseDays.split("");
			var courseStart = [$(this).find('.hourSelect').find("option:selected").val(), $(this).find('.minuteSelect').find("option:selected").val()];
			
			if(courseDays[0] === "p" || courseStart[0] === "pls pick" || courseStart[1] === "pick pls" || !courseName){
				return 0;
			}

			var thisCourse = new course(courseName, courseDays, courseStart);

			courseArray.push(thisCourse);
		});

		return courseArray;
	}
});