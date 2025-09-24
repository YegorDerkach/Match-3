import { ItemType } from "./item";
import type { DrawBox } from "./types";


const HEX_POINTS: ReadonlyArray<Readonly<{ x: number; y: number }>> = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});

export const drawers: Record<ItemType, (ctx: CanvasRenderingContext2D, box: DrawBox) => void> = {
  [ItemType.Pink]: (ctx, box) => {
    const r = box.size / 2;
    ctx.arc(box.cx, box.cy, r, 0, Math.PI * 2);
  },
  [ItemType.HotPink]: (ctx, box) => {
    ctx.rect(box.px + box.padding, box.py + box.padding, box.size, box.size);
  },
  [ItemType.DeepPink]: (ctx, box) => {
    ctx.moveTo(box.cx, box.py + box.padding);
    ctx.lineTo(box.px + box.padding, box.py + box.padding + box.size);
    ctx.lineTo(box.px + box.padding + box.size, box.py + box.padding + box.size);
    ctx.closePath();
  },
  [ItemType.PaleVioletRed]: (ctx, box) => {
    ctx.moveTo(box.cx, box.cy - box.half);
    ctx.lineTo(box.cx + box.half, box.cy);
    ctx.lineTo(box.cx, box.cy + box.half);
    ctx.lineTo(box.cx - box.half, box.cy);
    ctx.closePath();
  },
  [ItemType.MediumVioletRed]: (ctx, box) => {
    const r = box.half;
    for (let i = 0; i < 6; i++) {
      const vx = box.cx + r * HEX_POINTS[i].x;
      const vy = box.cy + r * HEX_POINTS[i].y;
      if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  }
};


export const SHARED_BOX: DrawBox = {
  px: 0,
  py: 0,
  cell: 0,
  padding: 0,
  cx: 0,
  cy: 0,
  size: 0,
  half: 0,
};


// Sprite cache to avoid rebuilding shapes every frame on weak devices
const spriteCache = new Map<string, HTMLCanvasElement>();

function keyFor(type: ItemType, size: number, enableEffects: boolean, color: string): string {
  return `${type}-${size}-${enableEffects ? 1 : 0}-${color}`;
}

export function getItemSprite(
  type: ItemType,
  size: number,
  enableEffects: boolean,
  color: string
): HTMLCanvasElement {
  const rounded = Math.max(8, Math.min(512, Math.round(size)));
  const key = keyFor(type, rounded, enableEffects, color);
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = rounded;
  canvas.height = rounded;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const padding = Math.floor(Math.max(1, Math.round(rounded * 0.125))); // ~1/8 of size
  const cell = rounded;
  const cx = cell / 2;
  const cy = cell / 2;
  const boxSize = cell - padding * 2;
  const half = boxSize / 2;

  ctx.save();
  if (enableEffects) {
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  }

  SHARED_BOX.px = 0;
  SHARED_BOX.py = 0;
  SHARED_BOX.cell = cell;
  SHARED_BOX.padding = padding;
  SHARED_BOX.cx = cx;
  SHARED_BOX.cy = cy;
  SHARED_BOX.size = boxSize;
  SHARED_BOX.half = half;

  ctx.fillStyle = color;
  ctx.beginPath();
  drawers[type](ctx as CanvasRenderingContext2D, SHARED_BOX);
  ctx.fill();

  if (enableEffects) {
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.stroke();
  }

  ctx.restore();
  spriteCache.set(key, canvas);
  return canvas;
}

