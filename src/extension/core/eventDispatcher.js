import { EventEmitter } from './eventEmitter';

class EventDispatcher {
  constructor() {
    this._emitter = new EventEmitter();
  }

  register(eventName, callback) {
    this._emitter.on(eventName, callback);
  }

  dispatch(eventName, event) {
    this._emitter.emit(eventName, event);
  }
}

export const eventDispatcher = new EventDispatcher();
