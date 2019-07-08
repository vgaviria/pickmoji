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

  emit(eventName, state) {
    const callbacks = this.eventHandlers[eventName];
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(state);
      });
    }
  }
}

