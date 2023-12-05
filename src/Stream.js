module.exports = class Stream {
  #thunks;
  #action;
  #flowing = false;
  #paused = false;

  constructor(id, ...thunks) {
    this.id = id;
    this.#thunks = thunks.flat();
    this.#flow();
  }

  clear() {
    this.#thunks.length = 0;
    return this;
  }

  pause() {
    this.#paused = true;
    return this;
  }

  resume() {
    this.#paused = false;
    return this.#flow();
  }

  abort() {
    this.#action?.abort();
    return this.clear();
  }

  push(...thunks) {
    this.#thunks.push(...thunks);
    return this.#flow();
  }

  unshift(...thunks) {
    this.#thunks.unshift(...thunks);
    return this.#flow();
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
    return (Stream[id] = new Stream(id, thunks));
  }
};
