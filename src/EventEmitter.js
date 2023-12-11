const EventEmitter = require('events');

module.exports = class Emitter extends EventEmitter {
  emit(event, data) {
    super.emit(event, data);
    super.emit('*', event, data);
  }
};
