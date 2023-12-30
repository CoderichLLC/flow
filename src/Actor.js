const EventEmitter = require('./EventEmitter');
const Action = require('./Action');
const Stream = require('./Stream');

module.exports = class Actor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
  }

  perform(action, data, context = {}) {
    context.actor = this;
    action = action instanceof Action ? action : Action[action];
    const promise = action(data, context);
    this.emit(`pre:${promise.id}`, { action, promise, data });
    promise.listen((i) => { if (i === 0) this.emit(`start:${promise.id}`, { action, promise, data }); });
    promise.then(result => this.emit(`post:${promise.id}`, { action, promise, result }));
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

    const abort = () => promise.abort();

    // Follow the source steps
    const sourceSteps = Array.from(new Array(sourcePromise.steps)).map((_, index) => {
      return new Promise((resolve) => {
        sourcePromise.then(() => { if (sourcePromise.aborted) abort(); }).catch(abort);
        sourcePromise.listen((i) => { if (i === index + 1) resolve(); }); // our 0 index should be i = 1
      });
    });

    // Delay execution until the source step is finished
    return (promise = this.perform(sourcePromise.id, data).listen(i => sourceSteps[i - 1])); // Skip the "start" step
  }

  static define(id) {
    return (Actor[id] = new Actor(id));
  }
};
