const EventEmitter = require('./EventEmitter');

module.exports = class Stream extends EventEmitter {
  #thunks;
  #action;
  #flowing = false;
  #paused = false;
  #closed = false;

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

  close(reason) {
    this.#closed = reason;
    this.#emit('close');
  }

  open() {
    this.#closed = false;
    this.#emit('open');
  }

  abort(...args) {
    this.#action?.abort(...args);
    this.#emit('abort', this.#action);
    return this.clear();
  }

  push(...thunks) {
    if (this.#closed !== false) return this.#reject(thunks.flat());
    this.#thunks.push(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  unshift(...thunks) {
    if (this.#closed !== false) return this.#reject(thunks.flat());
    this.#thunks.unshift(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  #emit(name) {
    this.emit(name, { action: this.#action });
  }

  #reject(thunks) {
    thunks.forEach(thunk => thunk().abort(this.#closed));
    return this;
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
