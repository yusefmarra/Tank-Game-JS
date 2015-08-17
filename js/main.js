// add scripts

;(function (){
  //Grab the canvas element from the DOM and get a 'context object'
  var canvas = document.getElementById('canvasId');
  var ctx = canvas.getContext('2d');
  // Define the Game Object
  function Game() {

    //Set the game size to equal the canvas size.
    this.gameSize = {x: canvas.width, y: canvas.height};

    // "entities" array to hold all the game objects
    this.player = new Player(this, this.gameSize);
    this.ai =  new AI(this, this.gameSize, this.player);
    var ob1 = new Obstacle(this.gameSize, this);
    var ob2 = new Obstacle(this.gameSize, this);
    var ob3 = new Obstacle(this.gameSize, this);
    this.ents = [ob1, ob2, ob3, this.player, this.ai ];
    this.bullets = []
    //so I can refer to the Game object in other scopes
    var self = this;

    // This function gets executed every 'frame'
    function tick() {
      self.update();
      self.draw(ctx, this.gameSize);
      //javascript thing to make sure it runs at a consistent speed across all computers
      requestAnimationFrame(tick);
    }
    // call tick the first time on instantiation
    tick();
  };

  Game.prototype = {
    //Call the update function on every entity
    update: function() {
      // console.log(this.ents);
      for (var i = 0; i < this.ents.length; i++) {
        this.ents[i].update();
      }
      for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[i].update()
      }
    },
    //Call the draw function on every entity
    draw: function() {
      ctx.clearRect(0,0,this.gameSize.x, this.gameSize.y)
      for (var i = 0; i < this.ents.length; i++) {
        this.ents[i].draw(ctx);
      }
      for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[i].draw(ctx);
      }
      // Draw the Player and AI's health on the screen
      ctx.font = "35px Serif"
      ctx.fillStyle = 'red';
      ctx.fillText("AI: " + this.ai.health, 675, 25)
      ctx.fillText("Player: " + this.player.health, 5, 25)

      //This tests for win conditions and draws the proper text
      if (this.player.health <= 0) {
        ctx.fillStyle = "red";
        ctx.font = "60px Serif";
        ctx.fillText("YOU FUCKING LOST!", this.gameSize.x/6, this.gameSize.y/2);
      } else if (this.ai.health <= 0) {
        ctx.fillStyle = "red";
        ctx.font = "60px Serif";
        ctx.fillText("YOU FUCKING WON!", this.gameSize.x/6, this.gameSize.y/2);
      }
    },
    //Add an entity to the entity array
    addEnt: function(ent){
      this.ents.push(ent);
    },
    addBullet: function(bullet) {
      this.bullets.push(bullet);
    }

  };

  // Define the Player object.
  function Player(game, gameSize) {
    this.gameSize = gameSize;
    //the instance of the game.
    this.game = game;
    // this.ai = this.game.ents[1];
    this.size = {x:25,y:25};
    this.center = { x: gameSize.x/2, y: gameSize.y/2}
    //Input object has a 'keys' dict and an 'isDown' function for getting pressed keys
    this.input = new Input();
    //Tracks the last time the player fired
    this.lastFired = Date.now();
    this.speed = 5;
    //rotation variable from 0 to 359 keeps track of the players orientation
    this.rotation = 0;
    //Need radians for the Math.cos and Math.sin functions
    this.radians = 0;
    this.health = 100;
  }

  Player.prototype = {
    update: function() {
      //converty the rotation to radians for forward and reverse movement
      this.radians = this.rotation * (Math.PI/180)
      // call the proper function based on input
      if (this.input.isDown("Up")) {
        this.forward();
      }
      if (this.input.isDown('Down')) {
        this.reverse();
      }
      if (this.input.isDown("Left")) {
        this.rotate(-5);
      }
      if (this.input.isDown("Right")) {
        this.rotate(5);
      }
      //Fire a bullet if the mouse is being pressed.
      if (this.input.isDown('mouse')) {
        // test if the player has fired too recently
        var newTime = Date.now();
        if (newTime - this.lastFired > 500) {
          var vector = {x:0,y:0};
          vector.x = (this.input.getPos()[0]-this.center.x);
          vector.y = (this.input.getPos()[1]-this.center.y);
          var center = { x: this.center.x, y: this.center.y};
          var bullet = new Bullet(vector, center);
          this.game.addBullet(bullet);
          this.lastFired = newTime;
        }

      }
      //Keep the Player on the screen
      if (this.center.x - this.size.x/2 < 0) {
        this.center.x = this.size.x/2;
      } else if (this.center.x + this.size.x/2 > this.gameSize.x) {
        this.center.x = this.gameSize.x - this.size.x/2;
      }
      if (this.center.y - this.size.x/2 < 0) {
        this.center.y = this.size.y/2;
      } else if (this.center.y + this.size.y/2 > this.gameSize.y) {
        this.center.y = this.gameSize.y - this.size.y/2;
      }

      for (var i = 0; i < this.game.ents.length; i++) {
        if (colliding(this, this.game.ents[i])) {
          this.reverse()
        }
      }

      // console.log(collidingWithBullets(this, this.game.bullets));
      // debugger;
      if (collidingWithBullets(this, this.game.bullets)) {
        this.health -= 10;
        // console.log(this.health);
      }
      if (this.health <= 0){
        // console.log(this);
        this.game.ents.splice(this.game.ents.indexOf(this),1);
      }
    },

    //These functions make the player object move like a tank
    //calculates the vector based off the rotation
    forward: function(){
      this.center.x = this.center.x + (this.speed * Math.sin(this.radians))
      this.center.y = this.center.y - (this.speed * Math.cos(this.radians))
    },
    reverse: function() {
      this.center.x = this.center.x - (this.speed * Math.sin(this.radians))
      this.center.y = this.center.y + (this.speed * Math.cos(this.radians))
    },
    rotate: function(degrees) {
      this.rotation += degrees;
      if (this.rotation > 359){
        this.rotation = 0;
      } else if (this.rotation < 0) {
        this.rotation = 359;
      }
    },

    //Draw function for putting the tank on the screen.
    draw: function(ctx){

      var pos = []
      if (this.input.getPos()) {
        pos = this.input.getPos();
      } else {
        pos = [0, this.size.y];
      }
      //Save our canvas's unrotated state
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.translate(this.center.x, this.center.y);
      // Rotate the canvas
      ctx.rotate(this.rotation*Math.PI/180);

      // Draw the 'tank'
      ctx.fillRect(0 - this.size.x/2,
                   0 - this.size.y/2,
                   this.size.x, this.size.y);
      // ctx.fillRect(0-this.size.x/2-10)

      ctx.beginPath();
      ctx.moveTo(0-this.size.x/2,0-this.size.y/2);
      ctx.lineTo(0, 0-this.size.y+5);
      ctx.lineTo(this.size.x/2, -this.size.y/2);
      ctx.fill();

      //Unrotate the canvas
      ctx.restore();


      // Draw the turret
      // use atan2 to take an difference in coordinates and get radians
      var atanArgs = {x: pos[0]-this.center.x, y: pos[1]-this.center.y};
      var radians = Math.atan2(atanArgs.x, atanArgs.y);

      // Use Math to get x and y for the end point of the barrel length 25
      var x = 25 * Math.sin(radians);
      var y = 25 * Math.cos(radians);

      //Save the context
      ctx.save();
      //Set the barrel width
      ctx.lineWidth = 5;
      // Recenter the grid on the player
      ctx.translate(this.center.x, this.center.y);
      // ctx.rotate(radians);
      ctx.beginPath();
      ctx.moveTo(0,0);
      //Draw a line to the end point of the barrel
      ctx.lineTo(x,y);
      ctx.strokeStyle = '#A3B5B5';
      ctx.stroke();
      //restore the context
      ctx.restore();
    }
  }


  function Bullet(vector, center) {
    var vector = vector;
    this.speed = 20;
    this.center = center;
    this.size = {x:4,y:4};
    var dx = vector.x
    var dy = vector.y
    var distance = Math.sqrt(dx*dx + dy*dy);

    this.velocity = { x: (dx/distance)*this.speed,
                      y: (dy/distance)*this.speed }

    this.center = { x: this.center.x+this.velocity.x,
                    y: this.center.y+this.velocity.y}


  };

  Bullet.prototype = {
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    },
    draw: function(ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(this.center.x - this.size.x/2,
                      this.center.y - this.size.y/2,
                      this.size.x, this.size.y)
    }
  };

  function AI(game, gameSize, player) {
    this.game = game;
    this.player = player;
    this.gameSize = gameSize;
    this.size = {x: 25, y: 25};
    this.center = { x: Math.random()*gameSize.x, y: Math.random()*gameSize.y}
    //Tracks the last time the AI fired
    this.lastFired = Date.now();
    this.speed = 5;
    //rotation variable from 0 to 359 keeps track of the players orientation
    this.rotation = 0;
    //Need radians for the Math.cos and Math.sin functions
    this.radians = 0;
    this.health = 100;
  }
  AI.prototype = {
    forward: function(){
      this.center.x = this.center.x + (this.speed * Math.sin(this.radians))
      this.center.y = this.center.y - (this.speed * Math.cos(this.radians))
    },
    reverse: function() {
      this.center.x = this.center.x - (this.speed * Math.sin(this.radians))
      this.center.y = this.center.y + (this.speed * Math.cos(this.radians))
    },
    rotate: function(degrees) {
      this.rotation += degrees;
      if (this.rotation > 359){
        this.rotation = 0;
      } else if (this.rotation < 0) {
        this.rotation = 359;
      }
    },
    update: function() {

      this.radians = this.rotation * (Math.PI/180)

      var distanceFromPlayer = Math.sqrt(
              (this.center.x-this.player.center.x)*(this.center.x-this.player.center.x) +
              (this.center.y-this.player.center.y)*(this.center.y-this.player.center.y)
            );

      var atanArgs = {x: this.player.center.x-this.center.x,
                      y: this.player.center.y-this.center.y};
      //get the radians from the player.
      var radians = Math.atan2(atanArgs.x, atanArgs.y);
      // var degrees = radians * (180/Math.PI);
      var xStep = (10*Math.sin(radians));
      var yStep = (10*Math.cos(radians));
      // console.log(xStep, yStep);
      // console.log(this.rotation);

      //THIS IS THE AI'S ARTIFICIAL RETARDEDNESS
      // Negative X and Y (Top Left)
      if (xStep < 0 && yStep < 0 && this.rotation > 270) {
        this.forward();
      }
      // Positive X and Negative Y (Top Right)
      else if (xStep > 0 && yStep < 0 && this.rotation > 0 && this.rotation < 90) {
        this.forward();
      }
      // Negative X and Positive Y (Bottom Left)
      else if (xStep < 0 && yStep > 0 && this.rotation > 180 && this.rotation <270) {
        this.forward();
      }
      // Positive X and Positive Y (Bottom Right)
      else if (xStep > 0 && yStep > 0 && this.rotation < 180 && this.rotation > 90) {
        this.forward();
      } else {

        // Negative X and Y (Top Left)
        if (xStep < 0 && yStep < 0) {
          if (this.rotation < 292 && this.rotation > 152) {
            this.rotate(5);
          } else { this.rotate(-5); }
        }
        // Positive X and Negative Y (Top Right)
        else if (xStep > 0 && yStep < 0) {
          if (this.rotation > 225 || this.rotation < 22) {
            this.rotate(5);
          } else { this.rotate(-5); }
        }
        // Negative X and Positive Y (Bottom Left)
        else if (xStep < 0 && yStep > 0) {
          if (this.rotation > 247 || this.rotation < 45) {
            this.rotate(-5);
          } else { this.rotate(5); }
        }
        // Positive X and Positive Y (Bottom Right)
        else if (xStep > 0 && yStep > 0) {
          if (this.rotation > 292 || this.rotation < 112) {
            this.rotate(5);
          } else { this.rotate(-5); }
        }
      }
      for (var i = 0; i < this.game.ents.length; i++) {
        if (colliding(this, this.game.ents[i])) {
          this.reverse()
        }
      }
      // console.log(collidingWithBullets(this, this.game.bullets));

      if (collidingWithBullets(this, this.game.bullets)) {
        this.health -= 10;
        // console.log(this.health);
      }
      if (this.health <= 0){
        this.game.ents.splice(this.game.ents.indexOf(this),1);
        // console.log(this.game.ents);
      }
      // console.log(this.health);

      //Keep the AI on the screen
      if (this.center.x - this.size.x/2 < 0) {
        this.center.x = this.size.x/2;
      } else if (this.center.x + this.size.x/2 > this.gameSize.x) {
        this.center.x = this.gameSize.x - this.size.x/2;
      }
      if (this.center.y - this.size.x/2 < 0) {
        this.center.y = this.size.y/2;
      } else if (this.center.y + this.size.y/2 > this.gameSize.y) {
        this.center.y = this.gameSize.y - this.size.y/2;
      }

      //See if the AI can fire
      //If it can, it does.
      var newTime = Date.now();
      if (newTime - this.lastFired > 1000) {
        var vector = {x:0,y:0};
        vector.x = (this.player.center.x-this.center.x);
        vector.y = (this.player.center.y-this.center.y);
        var center = { x: this.center.x, y: this.center.y};
        var bullet = new Bullet(vector, center);
        this.game.addBullet(bullet);
        this.lastFired = newTime;
      }

    },
    draw: function(ctx) {


      //Save our canvas's unrotated state
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.translate(this.center.x, this.center.y);
      // Rotate the canvas
      ctx.rotate(this.rotation*Math.PI/180);

      // Draw the 'tank'
      ctx.fillRect(0 - this.size.x/2,
                   0 - this.size.y/2,
                   this.size.x, this.size.y);
      // ctx.fillRect(0-this.size.x/2-10)

      //Put a little triangle on the front so we know which way is forward
      ctx.beginPath();
      ctx.moveTo(0-this.size.x/2,0-this.size.y/2);
      ctx.lineTo(0, 0-this.size.y+5);
      ctx.lineTo(this.size.x/2, -this.size.y/2);
      ctx.fill();

      //Unrotate the canvas
      ctx.restore();

      // Draw the turret
      // use atan2 to take an difference in coordinates and get radians
      var atanArgs = {x: this.player.center.x-this.center.x,
                      y: this.player.center.y-this.center.y};
      var radians = Math.atan2(atanArgs.x, atanArgs.y);

      // Use Math to get x and y for the end point of the barrel length 25
      var x = 25 * Math.sin(radians);
      var y = 25 * Math.cos(radians);

      //Save the context
      ctx.save();
      //Set the barrel width
      ctx.lineWidth = 5;
      // Recenter the grid on the player
      ctx.translate(this.center.x, this.center.y);
      // ctx.rotate(radians);
      ctx.beginPath();
      ctx.moveTo(0,0);
      //Draw a line to the end point of the barrel
      ctx.lineTo(x,y);
      ctx.strokeStyle = '#A3B5B5';
      ctx.stroke();
      //restore the context
      ctx.restore();



    }
  }

  function Obstacle(gameSize, game){
    this.game = game;
    var rand = Math.random()*gameSize.x/10
    this.size = { x: rand, y: rand };
    this.color = 'blue';
    this.center = { x: Math.random()*gameSize.x, y: Math.random()*gameSize.y}
    this.rotation = Math.random()*350;
  }

  Obstacle.prototype = {
    update: function(){
      if (collidingWithBullets(this, this.game.bullets)) {
        //do Nothing, we're just making sure the bullets dont pass through
      }
    },
    draw: function(ctx) {
      ctx.fillStyle = this.color;
      ctx.save();
      ctx.translate(this.center.x, this.center.y);
      // Rotate the canvas
      ctx.rotate(this.rotation*Math.PI/180);

      // Draw the Obstacle
      ctx.fillRect(0 - this.size.x/2,
                   0 - this.size.y/2,
                   this.size.x, this.size.y);
      ctx.restore();
    }
  }

  // Input object tracks input from the keyboard and mouse
  function Input() {
    var keyState = {};
    window.onkeydown = function(event) {
      keyState[event.keyIdentifier] = true;
    };
    window.onkeyup = function(event) {
      keyState[event.keyIdentifier] = false;
    };
    window.onmousedown = function(event) {
      keyState['mouse'] = true;
    };
    window.onmouseup = function(event) {
      keyState['mouse'] = false;
    };
    window.onmousemove = function(event) {
      keyState['mousePos'] = [event.offsetX, event.offsetY];
    }
    this.isDown = function(key) {
      return keyState[key] === true;
    }
    this.getPos = function() {
      return keyState['mousePos'];

    }
  }

  var drawRect = function(ctx, ent) {
    ctx.fillRect(ent.center.x - ent.size.x/2,
                 ent.center.y - ent.size.y/2,
                 ent.size.x, ent.size.y)
  };

  var colliding = function(ent1, ent2) {
    return !(ent1 === ent2 ||
             ent1.center.x + ent1.size.x/2 < ent2.center.x - ent2.size.x/2 ||
             ent1.center.y + ent1.size.y/2 < ent2.center.y - ent2.size.y/2 ||
             ent1.center.x - ent1.size.x/2 > ent2.center.x + ent2.size.x/2 ||
             ent1.center.y - ent1.size.y/2 > ent2.center.y + ent2.size.y/2);
  }
  var collidingWithBullets = function(entity, bulletsArray) {
    for (var i = 0; i < bulletsArray.length; i++) {
      if (colliding(entity, bulletsArray[i])) {
        bulletsArray.splice(i,1);
        return true;
      }
    }
    return false;
  }

  window.onload = function() {
    var game = new Game();
    var resetBtn = document.getElementById('reset');
    resetBtn.addEventListener('click', function(){
      game = new Game();
    })
  };
})();
