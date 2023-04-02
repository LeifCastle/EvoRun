//====== Global DOM Variables ======\\
const game = document.querySelector("#game");
const playButton = document.querySelector("#playButton");

//Images
const pathImage = document.querySelector("#path");
const playerImage = document.querySelector("#player");

//====== Global Variables ======\\

//====== Initialize Canvas ======\\
const ctx = game.getContext("2d");
game.setAttribute("height", 450); //Set to getComputedStyle(game)["height"] after creating grid in index.html
game.setAttribute("width", 900); //Set to getComputedStyle(game)["width"] after creating grid in index.html

//====== Event Listeners ======\\
window.addEventListener("DOMContentLoaded", function () {
  playButton.addEventListener("click", initializeGame);
});

//====== Renderable Classes ======\\
class Path {
  constructor(image, start) {
    this.image = image;
    this.start = start;
    this.y = 0; //set to center variable later?
  }
  render() {
    ctx.drawImage(this.image, this.start, this.y);
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

//====== Initialize Game ======\\
function initializeGame() {
  //Initialize entities to render
  const path = new Path(pathImage, 0);
  const player = new Player(playerImage, 20, 60);

  //Render entities
  path.render();
  player.render();
}
