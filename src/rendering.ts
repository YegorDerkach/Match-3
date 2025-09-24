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


