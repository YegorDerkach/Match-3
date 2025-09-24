import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas context not found");
}
const game = new Game(canvas, ctx);

function handleResize() {
  game.handleResize();
}

let resizeRaf = 0 as unknown as number;
function handleResizeDebounced() {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0 as unknown as number;
    handleResize();
  });
}

handleResize();
window.addEventListener("resize", handleResizeDebounced);
window.addEventListener("orientationchange", handleResizeDebounced);

const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;

startBtn?.addEventListener("click", () => {
  game.start();
});

resetBtn?.addEventListener("click", () => {
  game.reset();
});
