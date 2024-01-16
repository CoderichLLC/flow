const Action = require('./Action');
const { AbortError } = require('./Error');

module.exports = class Loop {
  constructor(...steps) {
    const action = new Action('loop', steps.flat());

    const proxy = (data, context = {}) => {
      const promise = action(data, { ...context });
      context.child = promise;

      return promise.then((result) => {
        return result instanceof AbortError ? result : proxy(result, context);
      });
    };

    return proxy;
  }
};
