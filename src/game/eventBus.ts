// Typed minimal event emitter for decoupled communication between Phaser and React UI
export type EventCallback<T = unknown> = (payload: T) => void;

export interface GameEvents {
  // Events will be defined by the build agent (e.g. 'interact:building', 'ui:open', 'ui:close')
  [key: string]: unknown;
}

class EventBus<Events extends Record<string, unknown> = GameEvents> {
  private listeners: Map<keyof Events, Set<EventCallback<unknown>>> = new Map();

  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
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
