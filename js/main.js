// add scripts

;(function (){
  // Define the Game Object
  function Game() {
    //Grab the canvas element from the DOM and get a 'context object'
    var canvas = document.getElementById('canvasId');
    var screen = canvas.getContext('2d');

    //Set the game size to equal the canvas size.
    var gameSize = {x: canvas.width, y: canvas.height};

    // "entities" array to hold all the game objects
    this.ents = [new Player(this, gameSize)];

    //so I can refer to the Game object in other scopes
    var self = this;

    // This function gets executed every 'frame'
    var tick = function() {
      self.update();
      self.draw(screen, gameSize);
      //javascript thing to make sure it runs at a consistent speed across all computers
      requestAnimationFrame(tick)
    };
    // call tick the first time on instantiation
    tick();
  };

  Game.prototype = {
    update: function() {
      for (var i = 0; i < this.ents.length; i++) {
        this.ents[i].update();
      }
    },
    draw: function(screen, gameSize) {
      // screen.fillRect(30,30,50,50)
      screen.clearRect(0,0,gameSize.x, gameSize.y)
      for (var i = 0; i < this.ents.length; i++) {
        drawRect(screen, this.ents[i]);
      }
    },
    addEnt: function(ent){
      this.ents.push(ent);
    }
  };

  // Define the Player object.
  function Player(game, gameSize) {
    this.gameSize = gameSize;
    this.game = game;
    this.size = {x:25,y:25};
    this.center = { x: gameSize.x/2, y: gameSize.y/2}
    this.input = new Input();
    this.lastFired = Date.now();
  }

  Player.prototype = {
    update: function() {
      // Move the player based on input
      if (this.input.isDown("Up")) {
        this.center.y -= 5;
      }
      if (this.input.isDown('Down')) {
        this.center.y += 5;
      }
      if (this.input.isDown("Left")) {
        this.center.x -= 5;
      }
      if (this.input.isDown("Right")) {
        this.center.x += 5;
      }
      //Fire a bullet if the mouse is being pressed.
      if (this.input.isDown('mouse')) {

        // test if the player has fired too recently
        var newTime = Date.now();
        if (newTime - this.lastFired > 500) {
          var vector = {x:0,y:0};
          vector.x = (this.input.getPos()[0]-this.center.x);
          vector.y = (this.input.getPos()[1]-this.center.y);
          var center = { x: this.center.x, y: this.center.y-this.size.y};
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

  }

  // Bullet object constructor, needs a direction to go in
  function Bullet(vector, center) {
    var vector = vector;
    this.speed = 20;
    this.center = center;
    this.size = {x:4,y:4};
    // sides of a right triangle joining
    var dx = vector.x
    var dy = vector.y
    var distance = Math.sqrt(dx*dx + dy*dy);

    this.velocity = { x: (dx/distance)*this.speed,
                     y: (dy/distance)*this.speed}




  };

  Bullet.prototype = {
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
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
      keyState['mousePos'] = [event.x, event.y];
    };
    window.onmouseup = function(event) {
      keyState['mouse'] = false;
    };
    this.isDown = function(key) {
      return keyState[key] === true;
    }
    this.getPos = function() {
      return keyState['mousePos'];
    }
  }

  var drawRect = function(screen, ent) {
    screen.fillRect(ent.center.x - ent.size.x/2,
                    ent.center.y - ent.size.y/2,
                    ent.size.x, ent.size.y)
  };

  window.onload = function() {
    new Game();
  };
})();
