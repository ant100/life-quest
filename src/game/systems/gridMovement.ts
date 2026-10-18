import type { Direction } from '../eventBus';
import {
  directionBetweenPoints,
  isWalkable,
  type GridPoint,
} from './pathfinding';

export const DIRECTION_DELTAS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export class GridMovementController {
  public tileX: number;
  public tileY: number;
  public facing: Direction = 'down';
  public isMoving = false;
  private pathQueue: GridPoint[] = [];

  constructor(startX: number, startY: number, initialFacing: Direction = 'down') {
    this.tileX = startX;
    this.tileY = startY;
    this.facing = initialFacing;
  }

  public getPosition(): GridPoint {
    return { x: this.tileX, y: this.tileY };
  }

  public getFacingTile(): GridPoint {
    const delta = DIRECTION_DELTAS[this.facing];
    return {
      x: this.tileX + delta.dx,
      y: this.tileY + delta.dy,
    };
  }

  public setPath(path: GridPoint[]): void {
    this.pathQueue = [...path];
  }

  public clearPath(): void {
    this.pathQueue = [];
  }

  public hasQueuedSteps(): boolean {
    return this.pathQueue.length > 0;
  }

  /**
   * Attempts to start a single tile step in `dir`.
   * Always updates `facing`. Returns the destination GridPoint if walkable, or null if blocked.
   */
  public tryStepDirection(
    dir: Direction,
    collisionGrid: boolean[][],
  ): GridPoint | null {
    if (this.isMoving) return null;
    this.facing = dir;
    const delta = DIRECTION_DELTAS[dir];
    const nextX = this.tileX + delta.dx;
    const nextY = this.tileY + delta.dy;
    if (!isWalkable(collisionGrid, nextX, nextY)) {
      return null;
    }
    this.isMoving = true;
    this.tileX = nextX;
    this.tileY = nextY;
    return { x: nextX, y: nextY };
  }

  /**
   * Pops the next step from the BFS path queue if available and walkable.
   */
  public popNextQueuedStep(collisionGrid: boolean[][]): GridPoint | null {
    if (this.isMoving || this.pathQueue.length === 0) {
      return null;
    }
    const next = this.pathQueue.shift()!;
    this.facing = directionBetweenPoints(
      { x: this.tileX, y: this.tileY },
      next,
    );
    if (!isWalkable(collisionGrid, next.x, next.y)) {
      this.pathQueue = [];
      return null;
    }
    this.isMoving = true;
    this.tileX = next.x;
    this.tileY = next.y;
    return next;
  }

  public completeStep(): void {
    this.isMoving = false;
  }
}
