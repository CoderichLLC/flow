const EventEmitter = require('events');
const Action = require('./Action');
const Stream = require('./Stream');

module.exports = class Actor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
  }

  perform(action, data) {
    action = action instanceof Action ? action : Action[action];
    const promise = action(data, { actor: this });
    this.emit(`pre:${action.id}`, { action, promise, data });
    promise.listen((i) => { if (i === 0) this.emit(`start:${promise.id}`, { action, promise, data }); });
    promise.then(result => this.emit(`post:${promise.id}`, { action, promise, result }));
    return promise;
  }

  stream(stream, action, data) {
    stream = stream instanceof Stream ? stream : Stream[stream];
    return new Promise((resolve, reject) => {
      stream.push(() => this.perform(action, data).then(resolve).catch(reject));
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
