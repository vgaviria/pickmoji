import { setTimeout } from "timers";

export class EventEmitter {
  constructor() {
    this.eventHandlers = {};
  }

  on(eventName, callback) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].push(callback);
    } else {
      this.eventHandlers[eventName] = [callback];
    }
  }

  emit(eventName, ...args) {
    const handlers = this.eventHandlers[eventName];
    for (let handlerIndex in handlers) {
      const callback = this.eventHandlers[eventName][handlerIndex];
      setTimeout(() => callback.apply(null, args));
    }
  }
}

