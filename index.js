//====== Global DOM Variables ======\\
const game = document.querySelector("#game");
const playButton = document.querySelector("#playButton");

//Images
const pathImage = document.querySelector("#path");
const playerImage = document.querySelector("#player");

//====== Global Variables ======\\
let path;
let nextPath;
let player;
let lane = -1;
let progress = 0; //This variable keeps track of how many pixels the player has progressed through the game
const cardEventFrequency = 20; //How many pixels the player must progress to get to the next card event
let newEvent;

//====== Initialize Canvas ======\\
const ctx = game.getContext("2d");
game.setAttribute("height", 450); //Set to getComputedStyle(game)["height"] after creating grid in index.html
game.setAttribute("width", 900); //Set to getComputedStyle(game)["width"] after creating grid in index.html

//====== Event Listeners ======\\
window.addEventListener("DOMContentLoaded", function () {
  playButton.addEventListener("click", initializeGame);
  document.addEventListener("keydown", (e) => playerMovement(e));
});

//====== Renderable Classes ======\\
class Path {
  constructor(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = image.width;
    this.height = image.height;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y);
  }
}

class Player {
  constructor(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y);
  }
}

class Event {
  constructor(event) {
    this.event = event;
  }
  render() {
    if ((this.event = "card")) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(10, 10, 10, 10);
    }
  }
}

//====== Initialize Game ======\\
function initializeGame() {
  //Initialize entities to render
  path = new Path(pathImage, 0, 0);
  nextPath = new Path(pathImage, path.x + path.width, 0);
  player = new Player(playerImage, 50, 60);

  //Run gameLoop at set interval
  const runGame = setInterval(gameLoop, 60);
}

//====== Game Functions ======\\
function gameLoop() {
  pathMovement();
  path.render();
  nextPath.render();
  player.render();
  const event = eventCheck();
  if (event != false) {
    newEvent = new Event(event);
  }
  if (newEvent) {
    newEvent.render();
  }
}

function playerMovement(e) {
  if (e.key === "w" && lane > -1) {
    lane--;
  }
  if (e.key === "s" && lane < 1) {
    lane++;
  }
  switch (lane) {
    case -1:
      player.y = 60;
      break;
    case 0:
      player.y = 200;
      break;
    case 1:
      player.y = 340;
      break;
  }
}

function pathMovement() {
  const speed = 1; //***ToDO:  set this to a linear or polynomial increment over game progress/time
  progress += speed;
  console.log("progress: ", progress);
  path.x -= speed;
  // If the first path is fully to the left of the canvas, reassign it to the next path
  if (path.x + path.width < 0) {
    path = nextPath;
  }
  //If the first path is to the left of the right side of the canvas, render a new path
  if (path.x + path.width < game.width) {
    nextPath = new Path(pathImage, path.x + path.width, 0);
  } else {
    //the else statement removes a noticeable jerk from creating a new path and immediately moving it
    nextPath.x -= speed;
  }
}

function eventCheck() {
  if (progress === cardEventFrequency) {
    return "card";
  } else {
    return false;
  }
}
