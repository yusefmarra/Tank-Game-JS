var canvas = document.getElementById('canvasId');
var ctx = canvas.getContext('2d');
var center = {x:canvas.width/2, y: canvas.height/2}
var speed = 5;
var rotation = 0;
var radians = 0;

function tick(){
  rotation++;


  if (rotation > 359){
    rotation = 0;
  } else if (rotation < 0) {
    rotation = 359;
  }
  console.log(rotation);

  radians = rotation * (Math.PI/180)

  // center.x = center.x + (speed * Math.sin(radians))
  // center.y = center.y + (speed * Math.cos(radians))

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation*Math.PI/180);
  ctx.beginPath();
  ctx.moveTo(0,0)
  ctx.lineTo(0,-25);
  ctx.stroke();
  ctx.fillRect(0 - 25/2,
               0 - 25/2,
               25, 25);
  ctx.restore();


  requestAnimationFrame(tick)
}
tick();
