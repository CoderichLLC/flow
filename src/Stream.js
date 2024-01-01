const EventEmitter = require('./EventEmitter');

module.exports = class Stream extends EventEmitter {
  #thunks;
  #action;
  #flowing = false;
  #paused = false;

  constructor(id, ...thunks) {
    super();
    this.id = id;
    this.#thunks = thunks.flat();
    this.#flow();
  }

  clear() {
    this.#thunks.length = 0;
    return this;
  }

  length() {
    return this.#thunks.length;
  }

  pause() {
    this.#paused = true;
    this.#emit('pause');
    return this;
  }

  resume() {
    this.#paused = false;
    this.#emit('resume');
    return this.#flow();
  }

  abort(...args) {
    this.#action?.abort(...args);
    this.#emit('abort');
    return this.clear();
  }

  push(...thunks) {
    this.#thunks.push(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  unshift(...thunks) {
    this.#thunks.unshift(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  #emit(name) {
    this.emit(name, { action: this.#action });
  }

  async #flow() {
    if (!this.#flowing && !this.#paused && this.#thunks.length) {
      this.#flowing = true;
      this.#action = this.#thunks.shift()(); // The thunk becomes an action!
      await this.#action;
      this.#flowing = false;
      this.#flow();
    }
    return this;
  }

  static define(id, ...thunks) {
    return (Stream[id] = new Stream(id, thunks.flat()));
  }
};
