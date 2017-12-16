var socket = io();

//Game
const WIDTH = 1280;
const HEIGHT = 720;
const PLAYERSPRITEWIDTH = 57;
const PLAYERSPRITEHEIGHT = 57;
const MININTERP = 0.01;
const MAXINTERP = 0.02;
const BLOODDURATION = 10000;
var ANIMATIONTIME = 100;
var scale = 1;
const MAXSCALE = 3;
const MINSCALE = 1;

var playerList = {};

window.onbeforeunload = function() { return "You work will be lost."; };

var canvas = document.getElementById('ctx');
canvas.onselectstart = function(){return false;}
var ctx = document.getElementById("ctx").getContext("2d");

var canvasbg = document.getElementById('ctxbg');
canvasbg.onselectstart = function(){return false;};
var ctxbg = document.getElementById("ctxbg").getContext("2d");

var canvashud = document.getElementById('ctxhud');
canvashud.onselectstart = function(){return false;};
var ctxhud = document.getElementById("ctxhud").getContext("2d");

ctx.scale(scale,scale);
ctxbg.scale(scale,scale);

var playerName = "";
var playerX = 0;
var playerY = 0;
var playerID = 0;

let xTrans = 0;
let yTrans = 0;

var mouseX = 0;
var mouseY = 0;
var mouseClicked = false;

var pressingUp = false;
var pressingDown = false;
var pressingLeft = false;
var pressingRight = false;

var loggedIn = false;
var loaded = false;

// Map sprite details
let loopHeight = 0;
let loopWidth = 0;
let width = 0;
let height = 0;
let imageHeight = 0;

var hudHPWidth = 26;
var hudHPLength = 62;
var hudOutlineThickness = 2;
var hudHPMargin = 20;
var hpBarWidth = 30;

function drawTestMap(testMap){
  ctxbg.fillRect(-WIDTH/2,-HEIGHT/2,2*WIDTH,2*HEIGHT);
}

function translateView(){
  xTrans = WIDTH/(2) - playerX*scale;
  yTrans = HEIGHT/(2) - playerY*scale;
  ctx.save();
  ctxbg.save();
  ctx.translate(xTrans,yTrans);
  ctxbg.translate(xTrans,yTrans);
}

function rotateAndCache(image,angle) {
  let offscreenCanvas = document.createElement('canvas');
  let offscreenCtx = offscreenCanvas.getContext('2d');

  let size = Math.max(image.width, image.height);
  offscreenCanvas.width = size;
  offscreenCanvas.height = size;

  offscreenCtx.translate(size/2, size/2);
  offscreenCtx.rotate(angle + Math.PI/2);
  offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));

  return offscreenCanvas;
}

// Initialize the actual player
socket.on('initPlayer',function(data){
  playerName = data.name;
  playerX = data.x;
  playerY = data.y;
  playerID = data.id;
  drawTestMap();
  hud = new Hud(ctxhud);
  loggedIn = true;
});

//init
socket.on('init', function(data){
  // { player:}w
  for(let i = 0; i < data.players.length; i++){
    let player = new Player(data.players[i]);
    playerList[player.id] = player;
  }
})

//updated
socket.on('update', function(data){
  for(let i = 0; i < data.players.length; i++){
    let pack = data.players[i];
    let p = playerList[pack.id];
    if(p){
      if(pack.x !== undefined){
        p.x = pack.x;
      }
      if(pack.y !== undefined){
        p.y = pack.y;
      }
      if(pack.hp !== undefined){
        p.hp = pack.hp;
      }
      if(pack.score !== undefined){
        p.score = pack.score;
      }
      if(pack.mouseAngle !== undefined){
        p.mouseAngle = pack.mouseAngle;
      }
    }
  }

});

//remove
socket.on('remove', function(data){
  for(let i = 0; i < data.players.length; i++){
    delete playerList[data.players[i]];
  }
})

document.onkeydown = function(event){
  if(!chatFocused){
    if(event.keyCode === 68) { // d
      socket.emit('keyPress', {inputId:'right', state: true});
      pressingRight = true;
    }
    else if(event.keyCode === 83) { // s
      socket.emit('keyPress', {inputId: 'down', state: true});
      pressingDown = true;
    }
    else if(event.keyCode === 65) { // a
      socket.emit('keyPress', {inputId: 'left', state: true});
      pressingLeft = true;
    }
    else if(event.keyCode === 87) { // w
      socket.emit('keyPress', {inputId: 'up', state: true});
      pressingUp = true;
    }
    else if(event.keyCode === 87) { // w
      socket.emit('keyPress', {inputId: 'up', state: true});
      pressingUp = true;
    }
  }
}

document.onkeyup = function(event){
  if(event.keyCode === 68) { // d
    socket.emit('keyPress', {inputId:'right', state: false});
    pressingRight = false;
  }
  else if(event.keyCode === 83) { // s
    socket.emit('keyPress', {inputId: 'down', state: false});
    pressingDown = false;
  }
  else if(event.keyCode === 65) { // a
    socket.emit('keyPress', {inputId: 'left', state: false});
    pressingLeft = false;
  }
  else if(event.keyCode === 87) { // w
    socket.emit('keyPress', {inputId: 'up', state: false});
    pressingUp = false;
  }
  else if(event.keyCode === 13) { // Enter
    toggleChat();
  }
}

document.onmousedown = function(event){
  if(!chatFocused){
  //socket.emit('keyPress', {inputId:'attack', state:true});
  mouseClicked = true;
  }
}

document.onmouseup = function(event){
  //socket.emit('keyPress', {inputId: 'attack', state:false});
  mouseClicked = false;
}

document.onmousemove = function(event){
  mouseX = event.clientX;
  mouseY = event.clientY;
  updateAngle();
}

function updateAngle(){
  //let x = mouseX - playerX;
  //let y = mouseY - playerY;
  let x = mouseX - WIDTH/2;
  let y = mouseY - HEIGHT/2;
  mouseAngle = Math.atan2(y,x) / Math.PI * 180;
  //socket.emit('keyPress', {inputId:'mouseAngle', state:mouseAngle});
}

function isPlayerMoving(){
    return pressingRight | pressingDown | pressingLeft | pressingUp | false;
}

document.addEventListener('mousewheel', function(e) {
  if(!chatFocused){
    setZoom(e.deltaY);
  }
}, false)

function setZoom(delta){
  if(delta < 0){
    scale+= 0.2;
    if(scale > MAXSCALE){
      scale = MAXSCALE;
    }
  } else {
    scale-= 0.2;
    if(scale < MINSCALE){
      scale = MINSCALE;
    }
  }
}

function sortPlayersByY(){
  let sortedList = [];
  for(let i in playerList){
    sortedList.push({
      key: i,
      y: playerList[i].y
    });
  }
  sortedList.sort(function(a,b){
    return a.y - b.y;
  });
  return sortedList;
}

function isLoaded(){
  if(loaded){
    return true;
  } else {
    for(let i in Img){
      for(let j in Img[i]){
        if(!Img[i][j].isLoaded){
          console.log('character sprite not loaded!');
          return false;
        }
      }
    }
    loaded = true;
    return true;
  }
}

let frameRate = 144;
let updateCount = 0;
let fpsTimer = Date.now();
let fpsCount = 0;
let fps = 0;
//Game update loop
setInterval(function() {
  // Update local player position
  if(loggedIn && isLoaded()){
    playerX = playerList[playerID].xOld;
    playerY = playerList[playerID].yOld;
    // Update aim
    if(updateCount >= 50){
      updateAngle();
    }

    translateView();
    ctx.scale(scale,scale);
    ctxbg.scale(scale,scale);

    if(isPlayerMoving){
      drawTestMap();
      ctxbg.restore();
    }

    // Draw players
    ctx.clearRect(-WIDTH/2,-HEIGHT/2,2*WIDTH,2*HEIGHT);

    let sortedList = sortPlayersByY();

    // Draw players in order from top to bottom of screen
    for(let i in sortedList){
      playerList[sortedList[i].key].draw();
    }
    ctxhud.clearRect(0,0,WIDTH,HEIGHT);
    hud.drawHud();

    ctx.restore();
    fpsCount++;
    if(Date.now() - fpsTimer >= 1000){
      let now = Date.now();
      fps = Math.floor(fpsCount/((now - fpsTimer)/1000));
      fpsCount = 0;
      fpsTimer = Date.now();
    }
  }

}, 1000/frameRate);
