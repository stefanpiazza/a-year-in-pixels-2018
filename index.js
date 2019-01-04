(() => {
	var IS_HIDDEN_CLS = 'is-hidden';

	var YEAR_KEY = {
		1: 'january',
		2: 'february',
		3: 'march',
		4: 'april',
		5: 'may',
		6: 'june',
		7: 'july',
		8: 'august',
		9: 'september',
		10: 'october',
		11: 'november',
		12: 'december',
	}

	var COLOUR_KEY = {
		0: 'white',
		1: 'orange',
		2: 'yellow',
		3: 'blue',
		4: 'green', 
		5: 'cyan',
		6: 'red'
	}

	var DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 27, 28, 29, 30, 31];

	var MONTHS = [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december',
	];

	YEAR = {}

	var form = document.querySelector('.form');
	var formEmail = form.querySelector('#email');
	var formPassword = form.querySelector('#password');

	form.addEventListener('submit', (e) => {
		e.preventDefault();

		var formData = new FormData(e.target);

		var email = formData.get('email');
		var password = formData.get('password');

		login(email, password);
	});

	var canvas = document.querySelector('#canvas');
	var ctx = canvas.getContext('2d');

	canvas.width = 360;
	canvas.height = canvas.width/12*31;

	canvasEls = [];

	window.addEventListener('resize', (e) => {
		canvas.width = 360;
		canvas.height = canvas.width/12*31;

		initCanvas();
	});

	canvas.addEventListener('click', (e) => {
		var auth = firebase.auth();
		auth.onAuthStateChanged((user) => {
			if (user) {
				var canvasDimensions = canvas.getBoundingClientRect();
				var mouse = {
					x: e.clientX-canvasDimensions.left,
					y: e.clientY-canvasDimensions.top
				}

				canvasEls.forEach((canvasEl) => {
					if (canvasEl.x <= mouse.x && 
						mouse.x <= canvasEl.x + canvasEl.w &&
						canvasEl.y <= mouse.y && 
						mouse.y <= canvasEl.y + canvasEl.h) {

						// Update firebase
						setUserYear(user.uid, canvasEl.month, canvasEl.day);

						// Update local
						YEAR[canvasEl.month][canvasEl.day] = ((YEAR[canvasEl.month][canvasEl.day] + 1) % 7);
						canvasEl.fillStyle = COLOUR_KEY[YEAR[canvasEl.month][canvasEl.day]];
					}
				});
			} 

			else {
			// User is signed out.
			}
		});
	});

	function getUserYear(userId) {
		var db = firebase.database();
		var dbRef = db.ref();
		var yearsRef = dbRef.child('years');
		var yearRef = yearsRef.child(userId);

		yearRef.once('value', (snap) => {
			YEAR = snap.val();

			initCanvas();
			animateCanvas();
		});
	}

	function setUserYear(userId, month, day) {
		var db = firebase.database();
		var dbRef = db.ref();
		var yearsRef = dbRef.child('years');
		var yearRef = yearsRef.child(userId);
		var monthRef = yearRef.child(month);
		var dayRef = monthRef.child(day);

		dayRef.once('value', (snap) => {
			value = snap.val();
			value = ((value + 1) % 7);
			dayRef.set(value);
		})
	}

	function Square(id, x, y, w, h, fillStyle) {
		this.id = id;

		this.x = x,
		this.y = y
		this.w = w;
		this.h = h;

		this.fillStyle = fillStyle;
	}

	Square.prototype = {
		draw: function() {
			ctx.fillStyle = this.fillStyle;
			ctx.fillRect(this.x, this.y, this.w, this.h);
		},

		update: function() {
			this.draw();
		}
	}

	function Text(id, x, y, message, fillStyle) {
		this.id = id;

		this.x = x,
		this.y = y

		this.message = message;

		this.fillStyle = fillStyle;
	}

	Text.prototype = {
		draw: function() {
			ctx.font = '20px sans-serif';
			ctx.fillStyle = this.fillStyle;
			ctx.fillText(this.message, this.x, this.y);
		},

		update: function() {
			this.draw();
		}
	}

	function initCanvas() {
		canvasEls = [];

		for (var i = 0; i < MONTHS.length; i++) {
			for (var j = 0; j < DAYS.length; j++) {
				var x = i*(canvas.width/12);
				var y = j*(canvas.width/12);
				var w = (canvas.width/12) - 2; 
				var h = (canvas.width/12) - 2;

				x += 1;
				y += 1;

				var square = new Square(Math.random(), x, y, w, h,
					COLOUR_KEY[YEAR[MONTHS[i]][DAYS[j]]]);
				square.month = MONTHS[i];
				square.day = DAYS[j];

				canvasEls.push(square);
			}
		}
	}

	function animateCanvas() {
		requestAnimationFrame(animateCanvas);
		ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

		for (var i = 0; i < canvasEls.length; i++) {
			canvasEls[i].update();
		}
	}

	function login(email, password) {
		var auth = firebase.auth();
		auth.signInWithEmailAndPassword(email, password)
		.then((data) => {
			var user = data.user;

			getUserYear(user.uid);

			formEmail.value = '';
			formPassword.value = '';
			form.classList.add(IS_HIDDEN_CLS);

			document.querySelector('.calendar').classList.remove(IS_HIDDEN_CLS);
		})
		.catch((error) => {
			console.log(error);
		})
	}

	function signup(email, password) {
		var auth = firebase.auth();
		auth.createUserWithEmailAndPassword(email, password)
		.then((data) => {
			var user = data.user;

			var year = {}
			year[user.uid] = {}

			for (var i = 0; i < MONTHS.length; i++) {
				var month = MONTHS[i];
				year[user.uid][month] = {}

				for (var j = 0; j < DAYS.length; j++) {
					var day = DAYS[j];

					year[user.uid][month][day] = 0;
				}
			}

			var db = firebase.database();
			var dbRef = db.ref();
			var yearsRef = dbRef.child('years');

			yearsRef.update(year);
		})
		.then(() => {
			login(email, password);
		})
		.catch((error) => {
			console.log(error);
		})
	}
})();