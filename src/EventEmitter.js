const EventEmitter = require('events');

module.exports = class Emitter extends EventEmitter {
  emit(...args) {
    super.emit(...args);
    super.emit('*', ...args);
  }
};
