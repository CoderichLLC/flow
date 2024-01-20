const Action = require('./Action');
const { AbortError } = require('./Error');

module.exports = class Loop {
  constructor(...steps) {
    const action = new Action('loop', steps.flat());

    return (data, context = {}) => {
      let promise;

      const loop = () => {
        promise = action(data, context);
        return promise.then((result) => {
          return result instanceof AbortError ? context.abort(result) : loop();
        });
      };

      // If the parent is aborted, abort the current promise
      context.promise.onAbort(reason => promise.abort(reason));

      return loop();
    };
  }
};
