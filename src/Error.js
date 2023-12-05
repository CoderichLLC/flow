exports.AbortError = class AbortError extends Error {
  constructor(msg, data = {}) {
    super(msg);
    this.data = data;
  }
};
