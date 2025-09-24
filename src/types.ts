export interface Coord { x: number; y: number }

export enum GameState { Idle, Swapping, Resolving, Falling }

export interface AnimationState {
  alpha: number;
  scale: number;
  falling: boolean;
  targetY?: number;
  startY?: number;
}

export interface DrawBox {
  px: number;
  py: number;
  cell: number;
  padding: number;
  cx: number;
  cy: number;
  size: number;
  half: number;
}


