//====== General ToDo ======\\
//make array of each class instance of cardEvents and run a forEach loop in game Loop for each function that deals with them

//====== Global DOM Variables ======\\
const game = document.querySelector("#game");
const playButton = document.querySelector("#playButton");
const restart = document.querySelector("#restart");
const scoreHtml = document.querySelector("#score");
const highScoreHtml = document.querySelector("#highScore");

//Images
const pathImage = document.querySelector("#path");
const playerImage = document.querySelector("#player");
const barrierImage = document.querySelector("#cardBarrier");
const lava = document.querySelector("#lava");

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
let badEvent;

//Scoring
let score = 0;
let highScore = 0;
const shieldMultiplier = 10; //Score is increased by number of shields gained * this multiplier (loosing shields does not decrease a player's score)
let distanceMultiplier = 0.01; //Score is increased by number of pixels the player has moved * this multiplier

//Other
let lane = -1; //The player initially starts in the upper lane
const speed = 10; //***ToDO:  set this to a linear or polynomial increment over game progress/time
const cardEventFrequency = -game.width + 100; //The number is how many pixels the player must progress to get to the next card event (plus at least one gamescreen width to remove double rendering intricacies)
const initialCardStart = 1000; //How many pixels to the right of the game screen's x-axis the cards initially start
const selectionRealistic = 15; //How many pixels the player's image can enter a card before it counts as selected
let blocked = false; //If the player is currently blocked by a card barrier
let eventAction; //The player selected event to run
let runGame;
let damage = 0; //Keeps track of how much damage the player is accruing
let lavaDamage = 3; //How much damage the player takes over time this is actually a combination of speed and the interval time, not jsut a straigh up number (gotta fix that)
let lavaFlows = 1; //Tracks of how many lavaFlows the player has crossed + the current one
const difficulty = 0; //negative difficulty is easer
let shields = 3; //Tracks the highest number of total shields the player could possibly aquire (player class is currently called with three shields so this is set to three)

//====== Initialize Canvas ======\\
const ctx = game.getContext("2d");
game.setAttribute("height", 450); //Set to getComputedStyle(game)["height"] after creating grid in index.html
game.setAttribute("width", 900); //Set to getComputedStyle(game)["width"] after creating grid in index.html

//====== Event Listeners ======\\
window.addEventListener("DOMContentLoaded", function () {
  playButton.addEventListener("click", initializeGame);
  document.addEventListener("keydown", (e) => playerMovement(e));
  restart.addEventListener("click", () => (player.number = -100)); //If player clicks restart, end the game (player.number is -100 shields so that game over won't show up)
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
  constructor(image, x, y, number, cloneImage) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = image.width;
    this.height = image.height;
    this.number = number;
  }
  render() {
    ctx.drawImage(this.image, this.x, this.y); //Draw Player Image

    //Shield Rendering
    const shieldRendering = {
      1: [this.width + 10, 5], //Right 0
      2: [this.width + 10, 25], //Right - 1
      3: [this.width + 10, -15], //Right + 1
      4: [this.width + 10, 45], //Right - 2
      5: [this.width + 10, -35], //Right + 2
      6: [this.width - 10, -35], //Top 0
      7: [this.width - 30, -35], //Top -1
      8: [this.width - 50, -35], //Left 1
      9: [this.width - 50, -15], //Left 2
      10: [this.width - 50, 5], //Left 3
      11: [this.width - 50, 25], //Left 4
      12: [this.width - 50, 45], //Left 5
      13: [this.width - 30, 45], //Left 4
      14: [this.width - 10, 45], //Left 5
    };

    ctx.fillStyle = "blue"; //Shield Color

    //Create correct number of shields
    for (i = 1; i <= this.number; i++) {
      const shieldXY = shieldRendering[i];
      ctx.fillRect(this.x + shieldXY[0], this.y + shieldXY[1], 10, 10);
    }
  }
}

class Event {
  constructor(event, x, y, cardText) {
    this.event = event;
    this.cardWidth = 150;
    this.cardHeight = 75;
    this.x = x;
    this.y = y;
    this.show = true; //If this event is visible, (false when the player selects it)
    this.cardText = cardText;
    this.run = false; //If this event has already run
    this.lavaWidth = 186;
  }
  render() {
    if (this.event === "card" && this.show === true) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(this.x, this.y, this.cardWidth, this.cardHeight);
      ctx.font = "20px arial";
      ctx.fillStyle = "#006400";
      ctx.textAlign = "center";
      ctx.fillText(
        this.cardText,
        this.x + this.cardWidth / 2,
        this.y + this.cardHeight / 2 + 15
      );
    }
    if (this.event === "damage") {
      ctx.drawImage(lava, this.x, this.y);
    }
  }
  move() {
    this.x -= speed;
  }
  action() {
    const action = this.cardText.split("");
    switch (action[0]) {
      case "+":
        player.number += parseInt(action[2]);
        score += parseInt(action[2]) * shieldMultiplier;
        break;
      case "-":
        player.number -= parseInt(action[2]);
        break;
    }
    eventAction = false; //resets event action and prevents this class method from being called repeatedly
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
  playButton.setAttribute("hidden", "hidden");
  restart.removeAttribute("hidden");
  path = new Path(pathImage, 0, 0);
  nextPath = new Path(pathImage, path.x + path.width, 0);
  barrier1 = new Barrier(barrierImage, initialCardStart, 138);
  barrier2 = new Barrier(barrierImage, initialCardStart, 270);
  player = new Player(playerImage, 150, 80, 3);
  let text = verifyNewCard();
  card1 = new Event("card", initialCardStart, 50, text[0]);
  card2 = new Event("card", initialCardStart, 185, text[1]); //CardBarrier
  card3 = new Event("card", initialCardStart, 330, text[2]);
  badEvent = new Event("damage", initialCardStart + 300, 20);
  lavaFlows++;

  //Run gameLoop at set interval
  runGame = setInterval(gameLoop, 60);
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
  if (!eventAction) {
    //If eventAction is not assigned (the player hasn't selected an event)
    checkEventSelection();
  }
  if (eventAction) {
    //If the player has selected and event
    eventAction.action();
  }
  eventMovement();
  card1.render();
  card2.render();
  card3.render();

  //Bad Events
  manageLava();

  //Characters
  player.render();

  //Score
  updateScore();

  //Game End
  gameOverCheck();
}

//Movement
function playerMovement(e) {
  if (e.key === "w" && lane > -1 && !blocked) {
    lane--; //Move up
  }
  if (e.key === "s" && lane < 1 && !blocked) {
    lane++; //Move down
  }
  switch (lane) {
    case -1:
      player.y = 80; //Lane 1
      break;
    case 0:
      player.y = 220; //Lane 2
      player.render();
      break;
    case 1:
      player.y = 340; //Lane 3
      player.render();
      break;
  }
}

function pathMovement() {
  path.x -= speed; //Move Path
  score += speed * distanceMultiplier;
  distanceMultiplier += 0.01;
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
    let text = verifyNewCard();
    card1 = new Event("card", game.width, 50, text[0]);
    card2 = new Event("card", game.width, 185, text[1]);
    card3 = new Event("card", game.width, 330, text[2]);
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
  eventArray = [card1, card2, card3];
  eventArray.forEach((event) => {
    yMatch =
      player.y > event.y &&
      player.y + player.height < event.y + event.cardHeight;
    if (
      player.x + player.width - selectionRealistic > event.x &&
      yMatch === true &&
      event.run === false
    ) {
      event.show = false;
      card1.run = true;
      card2.run = true;
      card3.run = true;
      eventAction = event;
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

function gameOverCheck() {
  if (player.number <= 0) {
    ctx.clearRect(0, 0, game.width, game.height);
    clearInterval(runGame);
    //If playerclicked restart
    if (player.number != -100) {
      ctx.font = "50px sans";
      ctx.fillStyle = "#006400";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", game.width / 2, game.height / 2 - 50);
    }
    restart.setAttribute("hidden", "hidden");
    playButton.removeAttribute("hidden");
    playButton.textContent = "Play Again";
    score = 0; //reset the score
    shields = 0; //reset accrued shields
    lavaFlows = 0; //reset passed lava flows
  }
}

//Other
function newCardText() {
  let result = [];
  let howMany;
  for (i = 0; i < 3; i++) {
    //Math Cards
    const cardPossibilities = ["add", "subtract"];
    const randCard = Math.floor(Math.random() * cardPossibilities.length);
    const cardSelection = cardPossibilities[randCard];
    switch (cardSelection) {
      case "add":
        howMany = numberOfPeople();
        result.push(`+ ${howMany} people`);
        break;
      case "subtract":
        howMany = numberOfPeople();
        result.push(`- ${howMany} people`);
        break;
    }
  }
  return result;
}

function numberOfPeople() {
  const peoplePossibilities = [1, 2, 3, 4, 5]; //Possible number of people to add, subtract, etc
  const randPeople = Math.floor(Math.random() * peoplePossibilities.length);
  const peopleSelection = peoplePossibilities[randPeople];
  return peopleSelection;
}

//Bad Events
function manageLava() {
  badEvent.move();
  if (badEvent.x + badEvent.lavaWidth < 0) {
    badEvent = new Event("damage", game.width + 30, 20); //This is not quite the right x positioning
    lavaFlows++;
  }
  badEvent.render();
  if (
    player.x + player.width < badEvent.x + badEvent.lavaWidth &&
    player.x > badEvent.x
  ) {
    damage++;
    if (damage === lavaDamage) {
      player.number--;
      damage = 0;
    }
  } else {
    damage = 0;
  }
}

function updateScore() {
  if (score > highScore) {
    highScore = score;
  }
  scoreHtml.textContent = `Score: ${Math.floor(score)}`;
  highScoreHtml.textContent = `High Score: ${Math.floor(highScore)}`;
}

function verifyNewCard() {
  let currentShield = 0;
  let mostShields = 0;
  while (1 > 0) {
    text = newCardText();
    text.forEach((card) => {
      const action = card.split("");
      switch (action[0]) {
        case "+":
          currentShield = parseInt(action[2]); //currentShield is assigned the card's shield number
          if (currentShield > mostShields) {
            mostShields = currentShield;
          }
          break;
      }
    });
    shields += mostShields;
    //If the proposed provided shield option are greater than the amount of damage the player will take, use the cards
    if (lavaDamage * lavaFlows - difficulty < shields) {
      return text;
    }
  }
}
