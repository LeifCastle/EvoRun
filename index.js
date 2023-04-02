//====== General ToDo ======\\
//make array of each class instance of cardEvents and run a forEach loop in game Loop for each function that deals with them
//make barrier so player can't select multiple cards

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
const speed = 10; //***ToDO:  set this to a linear or polynomial increment over game progress/time
let cardProgress = 0; //This variable keeps track of how many pixels the player has progressed through the game
const cardEventFrequency = 400; //How many pixels the player must progress to get to the next card event
const initialCardStart = 200;
let card1;
let card2;
let card3;
let nextCard1;
let nextCard2;
let nextCard3;
const selectionRealistic = 15;

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
  constructor(event, x, y) {
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

//====== Initialize Game ======\\
function initializeGame() {
  //Initialize entities to render
  path = new Path(pathImage, 0, 0);
  nextPath = new Path(pathImage, path.x + path.width, 0);
  player = new Player(playerImage, 50, 60);
  card1 = new Event("card", initialCardStart, 50);
  card2 = new Event("card", initialCardStart + 200, 185);
  card3 = new Event("card", initialCardStart + 100, 330);

  //Run gameLoop at set interval
  const runGame = setInterval(gameLoop, 60);
}

//====== Game Functions ======\\
function gameLoop() {
  //Path
  pathMovement();
  path.render();
  nextPath.render();

  //Events
  checkEventSelection();
  eventMovement();
  card1.render();
  card2.render();
  card3.render();
  if (nextCard1) {
    //If next cards are out move and render them
    nextCard1.move();
    nextCard1.render();
    nextCard2.move();
    nextCard2.render();
    nextCard3.move();
    nextCard3.render();
  }

  //Characters
  player.render();
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
  cardProgress += speed;
  card1.move();
  card2.move();
  card3.move();
  if (cardProgress === cardEventFrequency) {
    //Card progress is relevant to how many pixels the game as advanced
    if (nextCard1) {
      //Prevents from running the very first time when nextCards don't exist yet
      card1 = nextCard1;
      card2 = nextCard2;
      card3 = nextCard3;
    }
    //***ToDo: Set these to be random distance apart from eachother
    nextCard1 = new Event("card", game.width, 50);
    nextCard2 = new Event("card", game.width + 200, 185);
    nextCard3 = new Event("card", game.width + 100, 330);
    cardProgress = -game.width + initialCardStart; //Not sure this correct, but it renders even spacing
  }
}

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
