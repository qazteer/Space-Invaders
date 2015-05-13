(function(){

	/*класс ИГРА*/
	var Game = function(canvasId){
		var canvas = document.getElementById(canvasId);
		var screen = canvas.getContext('2d');
		var gameSize = {
			x:canvas.width,
			y:canvas.height
		};

		/*моединяем массив invaders с обьектом Player с помощью concat*/
		this.bodies = createInvaders(this).concat([new Player(this, gameSize)]);

		var self = this;
		loadSound("shoot.wav", function(shootSound){
			self.shootSound = shootSound;
			var tick = function(){
				this.flagPlayer = false;
				this.flagInvaders = false;

				self.update();
				self.draw(screen, gameSize);
				if(flagPlayer && flagInvaders){
					requestAnimationFrame(tick);
				}
				else{
					if(!flagPlayer){
						alert('GAME OVER');
					}
					if(!flagInvaders){
						alert("YOU WIN!");
					}
					window.location.reload();
				}
			}

			tick();
		});	

	}

	Game.prototype = {
		update: function(gameSize){
			
			var bodies = this.bodies;

			/*проверка на наличие игрока и противника*/
			var Status = function(){
				for(var i=0;i<bodies.length;i++){
					if(bodies[i] instanceof Player){
						this.flagPlayer = true;
					}
					if(bodies[i] instanceof Invader){
						flagInvaders = true;
					}
				}
			}

			Status();

			/*проверяем столкнулись ли обьекты, возвращаем tru или false*/
			var notCollidingWidthAnything = function(b1){
				return bodies.filter(function(b2){
					return colliding(b1, b2);
				}).length == 0;
			}

			this.bodies = this.bodies.filter(notCollidingWidthAnything);

			/*очищаем массив от "тел" вышедших за рамки канваса (качается пуль)*/
			for(var i=0;i<this.bodies.length;i++){
				if(this.bodies[i].position.y < 0){
					this.bodies.splice(i,1);
				}
			}

			for(var i=0;i<this.bodies.length;i++){
				this.bodies[i].update();
			}
		},

		draw: function(screen, gameSize){
			clearCanvas(screen, gameSize);
			for(var i=0;i<this.bodies.length;i++){
				drawRect(screen, this.bodies[i]);
			}
		},
		/*добавление "тела" в игру*/
		addBody: function(body){
			this.bodies.push(body);
		},

		invadersBelow: function(invader){
			return this.bodies.filter(function(b){
				return b instanceof Invader &&
				b.position.y > invader.position.y &&
				b.position.x - invader.position.x < invader.size.width;
			}).length > 0;
		}
	}

	/*класс ЗАХВАТЧИКИ*/
	var Invader = function(game, position){
		this.game = game;
		this.position = position;

		this.img = new Image();
		this.img.src = 'invader.png';

		this.size = {width:50, height:50};
		/*рамки за которые не должны выходить захватчики*/
		this.patrolX = 0;
		this.speedX = 1;
	}

	Invader.prototype = {
		update: function(){
			if(this.patrolX<0 || this.patrolX>200){
				this.speedX = -this.speedX;
			}

			this.position.x += this.speedX;
			this.patrolX += this.speedX;

			if(Math.random() < 0.02 && !this.game.invadersBelow(this)){
				var bullet = new Bullet({x: this.position.x+this.size.width/2-5, y: this.position.y+this.size.height/2+5},
					{x:Math.random()-0.5, y:2});
					this.game.addBody(bullet);
			}
			
		}
	}

	/*класс ИГРОК*/
	var Player = function(game, gameSize){
		/*счётчик пуль*/
		this.bullets = 0;
		this.timer = 0;
		this.game = game;

		this.img = new Image();
		this.img.src = 'kspaceduel.png';
		/*размеры игрока*/
		this.size = {width: 50, height: 50};
		/*позиция игрока*/
		this.position = 
		{x: gameSize.x/2 - this.size.width/2, y: gameSize.y - this.size.height};
		/*создаём объект управления игроком*/
		this.keyboarder = new Keyboarder();
	}

	Player.prototype = {
		update: function(){
			if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)){
				if(this.position.x > 0){
					this.position.x-=2;
				}
			}
			if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)){
				if(this.position.x < 960){
					this.position.x+=2;
				}
			}
			if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)){
				/*Создаём обьект "пуля" и задаём координаты и скорость*/
				if(this.bullets < 1){
					var bullet = new Bullet({x: this.position.x+this.size.width/2-5, y: this.position.y},
					{x:0, y:-6});
					this.game.addBody(bullet);
					this.bullets++;
					this.game.shootSound.load();
					this.game.shootSound.play();
				}				
			}
			this.timer++;
			if(this.timer % 12 == 0){
				this.bullets = 0;
			}
		}
	}

	/*класс ПУЛЯ*/
	var Bullet = function(position, velocity){
		this.img = new Image();
		this.img.src = 'bullet.png';

		/*размеры пули*/
		this.size = {width: 10, height: 10};
		/*позиция пули*/
		this.position = position;
		/*скорость пули*/
		this.velocity = velocity;
	}

	Bullet.prototype = {
		update: function(){
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;
		}
	}

   /*класс управления персонажем*/
	var Keyboarder = function(){
		var keyState = {};

		window.onkeydown = function(e){
			keyState[e.keyCode] = true;
		}
		window.onkeyup = function(e){
			keyState[e.keyCode] = false;
		}
		/*проверяем нажата ли клавиша*/
		this.isDown = function(keyCode){
			return keyState[keyCode] === true;
		}

		/*массив с кейкодом клавиш управления*/
		this.KEYS = {LEFT: 37, RIGHT:39, SPACE:32};
	}

	/*функция долбавление захватчиков в игру*/
	var createInvaders = function(game){
		var invaders = [];
		for(var i=0; i<24; i++){
			var x = 30 + (i%8) * 100;
			var y = 30 + (i%3) * 100;
			invaders.push(new Invader(game, {x:x, y:y}));
		}
		return invaders;
	}

	/*функция звуков в игре*/
	var loadSound = function(url, callback){
		var loaded = function(){
			callback(sound);
			sound.removeEventListener("canplaythrough", loaded);
		}
		var sound = new Audio(url);
		sound.addEventListener("canplaythrough", loaded);
		sound.load();
	}

	/*функция столкновения обьектов в игре*/
	var colliding = function(b1, b2){
		return !(b1 == b2 ||
			b1.position.x + b1.size.width/2 < b2.position.x  ||
			b1.position.y + b1.size.height/2 < b2.position.y ||

			b1.position.x > b2.position.x + b2.size.width/2 ||
			b1.position.y > b2.position.y + b2.size.height/2);
	}

	/*функция перемещения*/
	var drawRect = function(screen, body){
		/*screen.fillRect(body.position.x, body.position.y, body.size.width, body.size.height);*/
		
		screen.drawImage(body.img, body.position.x, body.position.y, body.size.width, body.size.height);

	}

	var clearCanvas = function(screen, gameSize){
		screen.clearRect(0,0,gameSize.x, gameSize.y);
	}

	window.onload = function(){
		var start = document.getElementById("start");
		start.addEventListener('click', function(){
			start.style.display = "none";
			new Game("screen");	
		});
	}
})();
