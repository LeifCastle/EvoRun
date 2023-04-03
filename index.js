//====== General ToDo ======\\
//make array of each class instance of cardEvents and run a forEach loop in game Loop for each function that deals with them
//make barrier so player can't select multiple cards

//====== Global DOM Variables ======\\
const game = document.querySelector("#game");
const playButton = document.querySelector("#playButton");

//Images
const pathImage = document.querySelector("#path");
const playerImage = document.querySelector("#player");
const barrierImage = document.querySelector("#cardBarrier");

//====== Global Variables ======\\
//Class Instances
let path;
let nextPath;
let barrier1;
let barrier2;
let player;
let card1;
let card2;
let card3;
let nextCard1;
let nextCard2;
let nextCard3;

//Other
let lane = -1; //The player initially starts in the upper lane
const speed = 10; //***ToDO:  set this to a linear or polynomial increment over game progress/time
const cardEventFrequency = -game.width + 100; //The number is how many pixels the player must progress to get to the next card event (plus at least one gamescreen width to remove double rendering intricacies)
const initialCardStart = 200; //How many pixels to the right of the game screen's x-axis the cards initially start
const selectionRealistic = 15; //How many pixels the player's image can enter a card before it counts as selected
let blocked = false; //If the player is currently blocked by a card barrier

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
    this.width = image.width;
    this.height = image.height;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y);
  }
}

class Event {
  constructor(event, x, y, image) {
    this.event = event;
    this.cardWidth = 150;
    this.cardHeight = 75;
    this.x = x;
    this.y = y;
    this.show = true;
  }
  render() {
    if ((this.event = "card") && this.show === true) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(this.x, this.y, this.cardWidth, this.cardHeight); //Card 1
    }
  }
  move() {
    if (this.event === "card") {
      this.x -= speed;
    }
  }
}

class Barrier {
  constructor(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = 210;
  }
  render() {
    ctx.drawImage(this.image, this.x - 30, this.y);
    ctx.drawImage(this.image, this.x - 30, this.y);
  }
  move() {
    this.x -= speed;
  }
}

//====== Initialize Game ======\\
function initializeGame() {
  //Initialize entities to render
  path = new Path(pathImage, 0, 0);
  nextPath = new Path(pathImage, path.x + path.width, 0);
  barrier1 = new Barrier(barrierImage, initialCardStart, 138);
  barrier2 = new Barrier(barrierImage, initialCardStart, 270);
  player = new Player(playerImage, 50, 60);
  card1 = new Event("card", initialCardStart, 50);
  card2 = new Event("card", initialCardStart, 185); //CardBarrier
  card3 = new Event("card", initialCardStart, 330);

  //Run gameLoop at set interval
  const runGame = setInterval(gameLoop, 60);
}

//====== Game Functions ======\\
//GameLoop
function gameLoop() {
  //Game Style
  pathMovement();
  path.render();
  nextPath.render();
  barrierMovement();
  barrier1.render();
  barrier2.render();
  blocked = checkBarrier();

  //Events
  checkEventSelection();
  eventMovement();
  card1.render();
  card2.render();
  card3.render();

  //Characters
  player.render();
}

//Movement
function playerMovement(e) {
  console.log(blocked);
  if (e.key === "w" && lane > -1 && !blocked) {
    lane--; //Move up
  }
  if (e.key === "s" && lane < 1 && !blocked) {
    lane++; //Move down
  }
  switch (lane) {
    case -1:
      player.y = 60; //Lane 1
      break;
    case 0:
      player.y = 200; //Lane 2
      break;
    case 1:
      player.y = 340; //Lane 3
      break;
  }
}

function pathMovement() {
  path.x -= speed; //Move Path
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

function eventMovement() {
  card1.move();
  card2.move();
  card3.move();
  if (card1.x < cardEventFrequency) {
    card1 = new Event("card", game.width, 50);
    card2 = new Event("card", game.width, 185);
    card3 = new Event("card", game.width, 330);
  }
}

function barrierMovement() {
  barrier1.move();
  barrier2.move();
  if (barrier1.x < cardEventFrequency) {
    barrier1 = new Barrier(barrierImage, game.width, 138);
    barrier2 = new Barrier(barrierImage, game.width, 270);
  }
}

//Checks
function checkEventSelection() {
  eventArray = [card1, card2, card3, nextCard1, nextCard2, nextCard3];
  eventArray.forEach((event) => {
    if (event) {
      yMatch =
        player.y > event.y &&
        player.y + player.height < event.y + event.cardHeight;
      if (
        player.x + player.width - selectionRealistic > event.x &&
        yMatch === true
      ) {
        event.show = false;
      }
    }
  });
}

function checkBarrier() {
  //X's don't quite align (off by about 50) but not sure why
  if (
    player.x > barrier1.x - 50 &&
    player.x < barrier1.x + barrier1.width - 50
  ) {
    return true;
  }
  return false;
}
