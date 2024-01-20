const EventEmitter = require('./EventEmitter');
const { AbortError } = require('./Error');
const Action = require('./Action');
const Stream = require('./Stream');

module.exports = class Actor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
  }

  perform(action, data, context = {}) {
    action = action instanceof Action ? action : Action[action];
    context.actor = this;
    context.action = action;
    const promise = action(data, context);
    this.emit(`pre:${promise.id}`, { data, ...context });
    promise.onStart(() => this.emit(`start:${promise.id}`, { data, ...context }));
    promise.then((result) => {
      const type = result instanceof AbortError ? 'abort' : 'post';
      this.emit(`${type}:${promise.id}`, { data, result, ...context });
    });
    return promise;
  }

  stream(stream, action, data, context = {}) {
    stream = stream instanceof Stream ? stream : Stream[stream];
    context.stream = stream;

    return new Promise((resolve, reject) => {
      stream.push(() => {
        const promise = this.perform(action, data, context);
        promise.then(resolve).catch(reject);
        return promise; // We must return promise because that has all the methods (ie. abort())
      });
    });
  }

  follow(sourcePromise, data) {
    let promise;

    const abort = reason => promise.abort(reason);

    // Follow the source steps
    const sourceSteps = Array.from(new Array(sourcePromise.steps)).map((_, index) => {
      return new Promise((resolve) => {
        sourcePromise.then(() => { if (sourcePromise.aborted) abort('$source'); }).catch(abort);
        sourcePromise.listen((step) => { if (step === index + 1) resolve(); });
      });
    });

    // Delay execution until the source step is finished
    promise = this.perform(sourcePromise.id, data).listen(step => sourceSteps[step - 1]);
    promise.$follow = true;
    return promise;
  }

  static define(id) {
    return (Actor[id] = new Actor(id));
  }
};
