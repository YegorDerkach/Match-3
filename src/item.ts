export enum ItemType {
  Pink,
  HotPink,
  DeepPink,
  PaleVioletRed,
  MediumVioletRed
}

import type { AnimationState } from "./types";

export class Item {
  type: ItemType;
  x: number = 0;
  y: number = 0;    
  animation: AnimationState = {
    alpha: 1,
    scale: 1,
    falling: false,
  };
  removing: boolean = false;

  constructor(type: ItemType) {
    this.type = type;
  }

  getColor(): string {
    switch (this.type) {
        case ItemType.Pink: return "#FFC0CB"; 
        case ItemType.HotPink: return "#FF69B4";
        case ItemType.DeepPink: return "#FF1493";
        case ItemType.PaleVioletRed: return "#DB7093";
        case ItemType.MediumVioletRed: return "#C71585";
    }
  }
}


