import { setTimeout } from "timers";

export class EventEmitter {
  constructor() {
    this.eventHandlers = {};
  }

  on(eventName, callback, handlerId) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName][handlerId] = callback;
    } else {
      this.eventHandlers[eventName] = { handlerId: callback};
    }
  }

  unsubscribe(eventName, handlerId) {
    const handlers = this.eventHandlers[eventName];
    if (handlers) {
      delete handlers[handlerId];
    }
  }

  emit(eventName, state) {
    const handlers = this.eventHandlers[eventName];
    if (handlers) {
      for (let handlerId in handlers) {
        const callback = this.eventHandlers[eventName][handlerId];
        setTimeout(() => callback(state));
      }
    }
  }
}

