export type Direction = 'up' | 'down' | 'left' | 'right';

export type EventCallback<T = unknown> = (payload: T) => void;

export interface GameEvents {
  'interact:board': undefined;
  'interact:house': undefined;
  'interact:inn': undefined;
  'interact:sign': { title: string; text: string };
  'interact:npc': { name: string; text: string };
  'ui:open': undefined;
  'ui:close': undefined;
  'dpad:move': Direction;
  'dpad:action': undefined;
  'player:spriteChanged': 0 | 1 | 2 | 3;
  [key: string]: unknown;
}

class EventBus<Events extends Record<string, unknown> = GameEvents> {
  private listeners: Map<keyof Events, Set<EventCallback<unknown>>> = new Map();

  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
    return () => this.off(event, callback);
  }

  off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<unknown>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof Events>(event: K, payload?: Events[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(payload));
    }
  }
}

export const eventBus = new EventBus();
