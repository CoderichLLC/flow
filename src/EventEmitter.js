const EventEmitter = require('events');

module.exports = class Emitter extends EventEmitter {
  emit(...args) {
    super.emit(...args);
    super.emit('*', ...args);
  }

  offFunction(fn) {
    return this.eventNames().filter((eventName) => {
      return this.listeners(eventName).includes(fn);
    }).map(eventName => this.off(eventName, fn));
  }
};
