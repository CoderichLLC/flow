module.exports = class Step {
  constructor(step) {
    Object.setPrototypeOf(step, Step.prototype);
    return step;
  }
};
