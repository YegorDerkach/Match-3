import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas context not found");
}
const game = new Game(canvas, ctx);

const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;

startBtn?.addEventListener("click", () => {
  game.start();
});

resetBtn?.addEventListener("click", () => {
  game.reset();
});
