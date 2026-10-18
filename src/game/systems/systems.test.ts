import { describe, expect, it } from 'vitest';
import { GridMovementController } from './gridMovement';
import { directionBetweenPoints, findBfsPath } from './pathfinding';

describe('BFS pathfinding & grid movement (Milestone 3)', () => {
  const createGrid = (w: number, h: number): boolean[][] =>
    Array.from({ length: h }, () => new Array<boolean>(w).fill(false));

  it('finds shortest path around obstacles on the collision grid', () => {
    const grid = createGrid(6, 6);
    // Block (2, 1), (2, 2), (2, 3)
    grid[1]![2] = true;
    grid[2]![2] = true;
    grid[3]![2] = true;

    const path = findBfsPath(grid, { x: 1, y: 2 }, { x: 3, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 3, y: 2 });
    for (const pt of path) {
      expect(grid[pt.y]?.[pt.x]).toBe(false);
    }
  });

  it('routes to an adjacent walkable tile when tapping directly on a blocked building or NPC', () => {
    const grid = createGrid(5, 5);
    grid[2]![2] = true; // blocked sign/NPC at (2, 2)

    const path = findBfsPath(grid, { x: 2, y: 4 }, { x: 2, y: 2 });
    // Should stop at (2, 3), right in front of (2, 2)
    expect(path).toEqual([{ x: 2, y: 3 }]);
  });

  it('moves step-by-step and updates facing direction in GridMovementController', () => {
    const grid = createGrid(5, 5);
    grid[1]![2] = true; // obstacle above (2, 2)

    const ctrl = new GridMovementController(2, 2, 'down');

    // Step up into blocked tile -> updates facing to 'up' but returns null
    expect(ctrl.tryStepDirection('up', grid)).toBeNull();
    expect(ctrl.facing).toBe('up');
    expect(ctrl.getFacingTile()).toEqual({ x: 2, y: 1 });

    // Step right into open tile -> moves to (3, 2)
    const step = ctrl.tryStepDirection('right', grid);
    expect(step).toEqual({ x: 3, y: 2 });
    expect(ctrl.isMoving).toBe(true);
    ctrl.completeStep();
    expect(ctrl.isMoving).toBe(false);
    expect(directionBetweenPoints({ x: 2, y: 2 }, { x: 3, y: 2 })).toBe('right');
  });
});
