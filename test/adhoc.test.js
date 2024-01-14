const Actor = require('../src/Actor');
const Action = require('../src/Action');
// const Stream = require('../src/Stream');
const { timeout } = require('../src/Util');

let counter = 0;

describe('adhoc', () => {
  Action.define('one', [
    async (_, { actor }) => {
      return actor.perform('two');
    },
  ]);

  Action.define('two', async (_, { actor, abort }) => {
    await timeout(200);
    if (++counter < 3) return actor.perform('two');
    return abort('reason');
  });

  test('chained performances', async () => {
    const post = jest.fn();
    const abort = jest.fn();
    const actor = new Actor();
    actor.once('post:one', post);
    actor.once('post:two', post);
    actor.once('abort:one', abort);
    actor.once('abort:two', abort);
    await actor.perform('one');
    expect(post).toHaveBeenCalledTimes(0);
    expect(abort).toHaveBeenCalledTimes(2);
  });
});
