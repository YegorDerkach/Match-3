import { Item, ItemType } from "./item";

export class Board {
  width: number = 8;
  height: number = 8;
  grid: (Item | null)[][] = [];

  constructor() {
    this.init();
  }
    
  private causesMatch(x: number, y: number, type: ItemType, row: (Item | null)[] = []): boolean {
    if (x >= 2) {
      if (
        (row[x - 1] as Item).type === type &&
        (row[x - 2] as Item).type === type
      ) {
        return true;
      }
    }
  
    if (y >= 2) {
      if (
        (this.grid[y - 1][x] as Item).type === type &&
        (this.grid[y - 2][x] as Item).type === type
      ) {
        return true;
      }
    }
  
    return false;
  }
  private init() {
    for (let y = 0; y < this.height; y++) {
      const row: (Item | null)[] = [];
      for (let x = 0; x < this.width; x++) {
        let type: ItemType;
        do {
          type = Math.floor(Math.random() * 5) as ItemType;
        } while (this.causesMatch(x, y, type, row));
        const item = new Item(type);
        item.x = x; 
        item.y = y;
        row.push(item);
      }
      this.grid.push(row);
    }
  }  
  
  
  getItem(x: number, y: number): Item | null {
    if (y < 0 || y >= this.height) return null;
    if (x < 0 || x >= this.width) return null;
    return this.grid[y][x];
  }
    
    public findMatches(): { x: number; y: number }[] {
    const matches: { x: number; y: number }[] = [];
  
    for (let y = 0; y < this.height; y++) {
      let matchLength = 1;
      for (let x = 1; x < this.width; x++) {
        if ((this.grid[y][x] as Item)?.type === (this.grid[y][x - 1] as Item)?.type) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let k = 0; k < matchLength; k++) {
              matches.push({ x: x - 1 - k, y });
            }
          }
          matchLength = 1;
        }
      }
      if (matchLength >= 3) {
        for (let k = 0; k < matchLength; k++) {
          matches.push({ x: this.width - 1 - k, y });
        }
      }
    }
  
    for (let x = 0; x < this.width; x++) {
      let matchLength = 1;
      for (let y = 1; y < this.height; y++) {
        if ((this.grid[y][x] as Item)?.type === (this.grid[y - 1][x] as Item)?.type) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let k = 0; k < matchLength; k++) {
              matches.push({ x, y: y - 1 - k });
            }
          }
          matchLength = 1;
        }
      }
      if (matchLength >= 3) {
        for (let k = 0; k < matchLength; k++) {
          matches.push({ x, y: this.height - 1 - k });
        }
      }
    }
  
    const uniqueMatches = Array.from(
      new Map(matches.map(m => [`${m.x},${m.y}`, m])).values()
    );
  
    return uniqueMatches;
    }

    public removeMatches(matches: { x: number; y: number }[]) {
    for (const m of matches) {
        const item = this.grid[m.y][m.x];
        if (item) {
            item.removing = true;
        }
    }
    }

    public applyGravityAndSpawn() {
    for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
        const it = this.grid[y][x];
        if (it && it.animation.alpha <= 0) this.grid[y][x] = null;
        }

        let emptySpots = 0;
        for (let y = this.height - 1; y >= 0; y--) {
        const item = this.grid[y][x];
        if (!item) {
            emptySpots++;
        } else if (emptySpots > 0) {
            this.grid[y + emptySpots][x] = item;
            this.grid[y][x] = null;
            item.animation.targetY = y + emptySpots;
            item.animation.falling = true;
        }
        }

        for (let y = 0; y < emptySpots; y++) {
        const type: ItemType = Math.floor(Math.random() * 5) as ItemType;
        const newItem = new Item(type);
        newItem.x = x;
        newItem.y = -emptySpots + y;
        newItem.animation.targetY = y;
        newItem.animation.falling = true;
        this.grid[y][x] = newItem;
        }
    }
    }

            
        
  
  
}
