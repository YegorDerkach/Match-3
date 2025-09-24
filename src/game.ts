import { GameState } from "./types";
import { Board } from "./board";
import { Item, ItemType } from "./item";
import { drawers, SHARED_BOX } from "./rendering";

const CELL_SIZE = 64;
const TILE_PADDING = 8;
const SELECT_STROKE_WIDTH = 3;
const OUTLINE_LINE_WIDTH = 2;
const SHADOW_BLUR = 4;
const SHADOW_OFFSET_Y = 2;

const FADE_PER_MS = 0.0025;
const SCALE_PER_MS = 0.0015;
const FALL_SPEED_PX_PER_S = 720; 
const SWAP_SPEED_PX_PER_FRAME = 8;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}


export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private board: Board;
  private cellSize: number = CELL_SIZE;
  private rafId: number | null = null;
  private dirty: boolean = true;

  private selected: { x: number; y: number } | null = null;
  private state: GameState = GameState.Idle;
  private loopStarted: boolean = false;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.board = new Board();

    this.canvas.addEventListener("click", this.onClick.bind(this));
    this.setupTouch();
    this.handleResize();
    this.updateUI();
    this.requestTick();
    }
  private setState(next: GameState) {
    if (this.state === next) return;
    this.state = next;
    this.updateUI();
    if (this.state !== GameState.Idle) this.requestTick();
  }

  private updateUI() {
    const disabled = this.state !== GameState.Idle;
    this.canvas.style.cursor = disabled ? "not-allowed" : "pointer";
    const startBtn = document.getElementById("startBtn") as HTMLButtonElement | null;
    const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement | null;
    if (startBtn) startBtn.disabled = disabled || this.loopStarted;
    if (resetBtn) resetBtn.disabled = disabled;
  }



    private onClick(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const localX = (event.clientX - rect.left) * scaleX;
        const localY = (event.clientY - rect.top) * scaleY;
        const x = Math.floor(localX / this.cellSize);
        const y = Math.floor(localY / this.cellSize);
      
        if (x < 0 || x >= this.board.width || y < 0 || y >= this.board.height) return;
      

        if (this.state !== GameState.Idle) return;

        if (!this.selected) {
          this.selected = { x, y };
          this.dirty = true;
          this.requestTick();
        } else {
          
          this.trySwap(this.selected.x, this.selected.y, x, y);
      
          this.selected = null;
          this.dirty = true;
          this.requestTick();
        }
      }

private swapSpeed: number = SWAP_SPEED_PX_PER_FRAME; 

  private trySwap(x1: number, y1: number, x2: number, y2: number) {
    if (this.state !== GameState.Idle) return;
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) return;
    this.swapItems(x1, y1, x2, y2);
  }

  private commitSwap(x1: number, y1: number, x2: number, y2: number, item1: Item, item2: Item) {
    const grid = this.board.grid;
    grid[y1][x1] = item2;
    grid[y2][x2] = item1;
    item1.x = x2;
    item1.y = y2;
    item2.x = x1;
    item2.y = y1;
  }

  private revertSwap(x1: number, y1: number, x2: number, y2: number) {
    
    this.swapItems(x1, y1, x2, y2, true);
  }

    private swapItems(x1: number, y1: number, x2: number, y2: number, isReverting: boolean = false) {
    if (this.state !== GameState.Idle) return; 

    const item1 = this.board.getItem(x1, y1);
    const item2 = this.board.getItem(x2, y2);
    if (!item1 || !item2) return; 
    this.setState(GameState.Swapping);

    const dx = (x2 - x1) * this.cellSize;
    const dy = (y2 - y1) * this.cellSize;

    let progress = 0;

    const animate = () => {
        progress += this.swapSpeed;
        const t = Math.min(progress / this.cellSize, 1);

        
        item1.x = x1 + dx * t / this.cellSize;
        item1.y = y1 + dy * t / this.cellSize;
        item2.x = x2 - dx * t / this.cellSize;
        item2.y = y2 - dy * t / this.cellSize;

        if (t < 1) {
        requestAnimationFrame(animate);
        } else {
        
        this.commitSwap(x1, y1, x2, y2, item1, item2);

        this.setState(GameState.Idle);


        if (!isReverting) {
            const matches = this.board.findMatchesLocalized([
              { x: x1, y: y1 },
              { x: x2, y: y2 },
            ]);
            if (matches.length === 0) {
                
                this.revertSwap(x1, y1, x2, y2);
            } else {
                this.board.removeMatches(matches);
                this.setState(GameState.Resolving); 
            }
        }
        }
    };

    animate();
    }

      
      

  start() {
    if (this.loopStarted) return;
    this.loopStarted = true;
    this.updateUI();
    this.requestTick();
  }

  reset() {
    
    this.board = new Board();
    this.selected = null;
    this.setState(GameState.Idle);
    this.dirty = true;
    this.requestTick();
  }

  private loop(timestamp: number) {
    this.rafId = null;
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(delta);

    const hasAnimations = this.state !== GameState.Idle || this.anyItemFalling() || this.anyItemRemoving();
    if (hasAnimations || this.dirty) {
      this.render();
      this.dirty = false;
    }

    if (hasAnimations) {
      this.requestTick();
    }
  }

  private requestTick() {
    if (this.rafId == null) {
      this.rafId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  private update(delta: number) {
    
    if (this.state === GameState.Resolving) {
      let anyRemoving = false;
      for (let y = 0; y < this.board.height; y++) {
        for (let x = 0; x < this.board.width; x++) {
          const item = this.board.getItem(x, y);
          if (!item) continue;
          if (item.removing) {
            anyRemoving = true;
            item.animation.alpha = Math.max(0, item.animation.alpha - FADE_PER_MS * delta);
            item.animation.scale = Math.max(0.85, item.animation.scale - SCALE_PER_MS * delta);
            if (item.animation.alpha <= 0) {
              item.animation.alpha = 0;
              item.removing = false;
            }
          }
        }
      }
      if (!anyRemoving) {
        
        for (let y = 0; y < this.board.height; y++) {
          for (let x = 0; x < this.board.width; x++) {
            const it = this.board.getItem(x, y);
            if (it && it.animation.alpha <= 0) this.board.grid[y][x] = null;
          }
        }
        
        this.board.applyGravityAndSpawn();
        this.setState(GameState.Falling);
      }
    }

    
    if (this.state === GameState.Falling) {
      const cellsPerMs = (FALL_SPEED_PX_PER_S / 1000) / this.cellSize;
      let anyFalling = false;
      for (let y = 0; y < this.board.height; y++) {
        for (let x = 0; x < this.board.width; x++) {
          const item = this.board.getItem(x, y);
          if (!item) continue;
          if (item.animation.falling && item.animation.targetY !== undefined) {
            anyFalling = true;
            if (item.animation.startY === undefined) item.animation.startY = item.y;
            const total = item.animation.targetY - item.animation.startY;
            const totalAbs = Math.abs(total);
            if (totalAbs < 0.0001) {
              item.y = item.animation.targetY;
              item.animation.falling = false;
              item.animation.targetY = undefined;
              item.animation.startY = undefined;
              continue;
            }
            const currentAbs = Math.abs(item.y - item.animation.startY);
            const linearProgress = currentAbs / totalAbs;
            const linearNext = Math.min(1, linearProgress + (cellsPerMs * delta) / totalAbs);
            const eased = easeOutCubic(linearNext);
            const newY = item.animation.startY + eased * total;
            if (linearNext >= 1 || Math.abs(item.animation.targetY - newY) <= 0.01) {
              item.y = item.animation.targetY;
              item.animation.falling = false;
              item.animation.targetY = undefined;
              item.animation.startY = undefined;
            } else {
              item.y = newY;
            }
          }
        }
      }
      if (!anyFalling) {
        const nextMatches = this.board.findMatches();
        if (nextMatches.length > 0) {
          this.board.removeMatches(nextMatches);
          this.setState(GameState.Resolving); 
        } else {
          this.setState(GameState.Idle);
        }
      }
    }
  }

  private anyItemFalling(): boolean {
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        const item = this.board.getItem(x, y);
        if (item && item.animation.falling) return true;
      }
    }
    return false;
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.board.height; y++) {
        for (let x = 0; x < this.board.width; x++) {
          const item = this.board.getItem(x, y);
          if (!item) continue;
      
                                  
          this.ctx.globalAlpha = item.animation.alpha ?? 1;
          const px = item.x * this.cellSize;
          const py = item.y * this.cellSize;
          this.drawItemShape(item, px, py, this.cellSize);
          this.ctx.globalAlpha = 1;
        }
      }
      
    if (this.selected) {
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = SELECT_STROKE_WIDTH;
        this.ctx.strokeRect(
        this.selected.x * this.cellSize,
        this.selected.y * this.cellSize,
        this.cellSize,
        this.cellSize
        );
    }
  }
  
  private drawItemShape(item: Item, px: number, py: number, cell: number) {
    const padding = TILE_PADDING;
    const cx = px + cell / 2;
    const cy = py + cell / 2;
    const size = (cell - padding * 2);
    const half = size / 2;

    SHARED_BOX.px = px;
    SHARED_BOX.py = py;
    SHARED_BOX.cell = cell;
    SHARED_BOX.padding = padding;
    SHARED_BOX.cx = cx;
    SHARED_BOX.cy = cy;
    SHARED_BOX.size = size;
    SHARED_BOX.half = half;

    this.ctx.save();

    this.ctx.translate(cx, cy);
    const s = item.animation.scale ?? 1;
    this.ctx.scale(s, s);
    this.ctx.translate(-cx, -cy);

    const enableEffects = cell >= 40;
    if (enableEffects) {
      this.ctx.shadowColor = "rgba(0,0,0,0.25)";
      this.ctx.shadowBlur = SHADOW_BLUR;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = SHADOW_OFFSET_Y;
    } else {
      this.ctx.shadowColor = "transparent";
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }


    this.ctx.fillStyle = item.getColor();
    this.ctx.beginPath();
    drawers[item.type](this.ctx, SHARED_BOX);
    this.ctx.fill();


    this.ctx.shadowColor = "transparent";
    if (enableEffects) {
      this.ctx.lineWidth = OUTLINE_LINE_WIDTH;
      this.ctx.strokeStyle = "rgba(255,255,255,0.18)";
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  public handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    const sizeCss = Math.min(rect.width, rect.height || rect.width);
    const dpr = Math.min(2, Math.max(1, Math.floor(window.devicePixelRatio || 1)));
    const targetPx = Math.floor(sizeCss * dpr);
    const cells = Math.max(this.board.width, this.board.height);
    const snapped = Math.max(cells, targetPx - (targetPx % cells));
    if (this.canvas.width !== snapped || this.canvas.height !== snapped) {
      this.canvas.width = snapped;
      this.canvas.height = snapped;
    }
    this.cellSize = Math.floor(this.canvas.width / this.board.width);
    this.dirty = true;
    this.requestTick();
  }

  private setupTouch() {
    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      "touchend",
      (e) => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const localX = (touch.clientX - rect.left) * scaleX;
        const localY = (touch.clientY - rect.top) * scaleY;
        const x = Math.floor(localX / this.cellSize);
        const y = Math.floor(localY / this.cellSize);
        if (x < 0 || x >= this.board.width || y < 0 || y >= this.board.height) return;
        if (this.state !== GameState.Idle) return;
        if (!this.selected) {
          this.selected = { x, y };
          this.dirty = true;
          this.requestTick();
        } else {
          this.trySwap(this.selected.x, this.selected.y, x, y);
          this.selected = null;
          this.dirty = true;
          this.requestTick();
        }
        e.preventDefault();
      },
      { passive: false }
    );
  }

  private anyItemRemoving(): boolean {
    for (let y = 0; y < this.board.height; y++) {
      for (let x = 0; x < this.board.width; x++) {
        const item = this.board.getItem(x, y);
        if (item && item.removing) return true;
      }
    }
    return false;
  }
    
}
