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
    this.ents = [new Player(this, this.gameSize)];

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
      for (var i = 0; i < this.ents.length; i++) {
        this.ents[i].update();
      }
    },
    //Call the draw function on every entity
    draw: function() {
      // ctx.fillRect(30,30,50,50)
      ctx.clearRect(0,0,this.gameSize.x, this.gameSize.y)
      for (var i = 0; i < this.ents.length; i++) {
        // ctx.save();
        this.ents[i].draw(ctx);
        // ctx.restore();
      }
    },
    //Add an entity to the entity array
    addEnt: function(ent){
      this.ents.push(ent);
    }

  };

  // Define the Player object.
  function Player(game, gameSize) {
    this.gameSize = gameSize;
    //the instance of the game.
    this.game = game;
    this.size = {x:25,y:25};
    this.center = { x: gameSize.x/2, y: gameSize.y/2}
    //Input object has a 'keys' dict and an 'isDown' function for getting pressed keys
    this.input = new Input();
    //Tracks the last time the player fired
    this.lastFired = Date.now();
    this.speed = 5;
    this.direction = 0;
    //rotation variable from 0 to 359 keeps track of the players orientation
    this.rotation = 0;
    //Need radians for the Math.cos and Math.sin functions
    this.radians = 0;
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
          var center = { x: this.center.x, y: this.center.y-this.size.y/2};
          var bullet = new Bullet(vector, center);
          this.game.addEnt(bullet);
          // console.log(vector);
          console.log(bullet);
          console.log(center)
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
      console.log(pos[0]);
      ctx.save();
      ctx.translate(this.center.x, this.center.y);
      // Rotate the canvas
      ctx.rotate(this.rotation*Math.PI/180);
      // Draw the turret
      ctx.beginPath();
      ctx.moveTo(0,0)
      // ctx.lineTo(pos[0], pos[1]);
      ctx.lineTo(0,-this.size.y);
      ctx.stroke();
      // Draw the 'tank'
      ctx.fillRect(0 - this.size.x/2,
                   0 - this.size.y/2,
                   this.size.x, this.size.y);
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




  };

  Bullet.prototype = {
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    },
    draw: function() {

    }
  };

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

  window.onload = function() {
    var game = new Game();
  };
})();