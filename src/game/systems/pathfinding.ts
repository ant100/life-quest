import type { Direction } from '../eventBus';

export interface GridPoint {
  x: number;
  y: number;
}

const NEIGHBORS: { dx: number; dy: number; dir: Direction }[] = [
  { dx: 0, dy: -1, dir: 'up' },
  { dx: 0, dy: 1, dir: 'down' },
  { dx: -1, dy: 0, dir: 'left' },
  { dx: 1, dy: 0, dir: 'right' },
];

export function isWalkable(
  collisionGrid: boolean[][],
  x: number,
  y: number,
): boolean {
  const height = collisionGrid.length;
  const width = collisionGrid[0]?.length ?? 0;
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return false;
  }
  return !collisionGrid[y]?.[x];
}

/**
 * Breadth-First Search (BFS) shortest path on a 2D tile grid.
 * If the target tile itself is blocked (e.g. a building, sign, or NPC),
 * automatically routes to the closest walkable tile adjacent to the target.
 */
export function findBfsPath(
  collisionGrid: boolean[][],
  start: GridPoint,
  target: GridPoint,
): GridPoint[] {
  const height = collisionGrid.length;
  const width = collisionGrid[0]?.length ?? 0;
  if (height === 0 || width === 0) return [];

  if (start.x === target.x && start.y === target.y) {
    return [];
  }

  // Determine valid goal coordinates
  const goals: GridPoint[] = [];
  if (isWalkable(collisionGrid, target.x, target.y)) {
    goals.push(target);
  } else {
    // Prefer landing below a building/sign/NPC first (classic RPG front approach), then other sides
    const preferredOrder = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const off of preferredOrder) {
      const gx = target.x + off.dx;
      const gy = target.y + off.dy;
      if (isWalkable(collisionGrid, gx, gy)) {
        goals.push({ x: gx, y: gy });
      }
    }
  }

  if (goals.length === 0) {
    return [];
  }

  const goalKeySet = new Set(goals.map((g) => `${g.x},${g.y}`));
  const startKey = `${start.x},${start.y}`;
  if (goalKeySet.has(startKey)) {
    return [];
  }

  const queue: GridPoint[] = [start];
  const cameFrom = new Map<string, GridPoint>();
  const visited = new Set<string>([startKey]);

  let reachedGoal: GridPoint | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (goalKeySet.has(currentKey)) {
      reachedGoal = current;
      break;
    }

    for (const n of NEIGHBORS) {
      const nx = current.x + n.dx;
      const ny = current.y + n.dy;
      const nKey = `${nx},${ny}`;
      if (!visited.has(nKey) && isWalkable(collisionGrid, nx, ny)) {
        visited.add(nKey);
        cameFrom.set(nKey, current);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  if (!reachedGoal) {
    return [];
  }

  const path: GridPoint[] = [];
  let curr: GridPoint | undefined = reachedGoal;
  while (curr && !(curr.x === start.x && curr.y === start.y)) {
    path.push(curr);
    curr = cameFrom.get(`${curr.x},${curr.y}`);
  }

  path.reverse();
  return path;
}

export function directionBetweenPoints(
  from: GridPoint,
  to: GridPoint,
): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'down' : 'up';
}
