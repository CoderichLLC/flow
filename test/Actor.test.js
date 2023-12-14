const Actor = require('../src/Actor');
const Action = require('../src/Action');
const Stream = require('../src/Stream');
const { timeout } = require('../src/Util');

describe('Actor', () => {
  // Action steps
  const warmup = jest.fn(() => timeout(100).then(() => ({ warm: true })));
  const run = jest.fn(() => timeout(250).then(() => ({ ran: true })));
  const look = jest.fn(() => ({ looked: true }));
  const stretch = jest.fn(() => timeout(150).then(() => ({ stretched: true })));
  const abort = jest.fn((data, context) => context.abort());

  //
  Action.define('compete', warmup, run, look, stretch);
  Action.define('abort', run, abort, stretch);
  Stream.define('player1');
  Actor.define('player1');

  beforeEach(() => {
    warmup.mockClear();
    stretch.mockClear();
    look.mockClear();
    run.mockClear();
    abort.mockClear();
  });

  test('perform', async () => {
    const actor = Actor.player1;
    await actor.perform('compete', { actor: 'me' });
    expect(warmup).toHaveBeenCalledWith({ actor: 'me' }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(run).toHaveBeenCalledWith({ warm: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(look).toHaveBeenCalledWith({ ran: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(stretch).toHaveBeenCalledWith({ looked: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
  });

  test('stream', async () => {
    const actor = Actor.player1;
    await actor.stream('player1', 'compete', { actor: 'hi' });
    expect(warmup).toHaveBeenCalledWith({ actor: 'hi' }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(run).toHaveBeenCalledWith({ warm: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(look).toHaveBeenCalledWith({ ran: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
    expect(stretch).toHaveBeenCalledWith({ looked: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
  });

  test('events + follow', (done) => {
    Actor.player1.once('start:compete', async ({ promise }) => {
      const actor = new Actor();
      await actor.follow(promise);
      expect(warmup).toHaveBeenCalledTimes(2);
      expect(run).toHaveBeenCalledTimes(2);
      expect(look).toHaveBeenCalledTimes(2);
      expect(stretch).toHaveBeenCalledTimes(2);
      expect(stretch).toHaveBeenCalledWith({ looked: true }, expect.objectContaining({ abort: expect.any(Function), actor }));
      expect(stretch).toHaveBeenCalledWith({ looked: true }, expect.objectContaining({ abort: expect.any(Function), actor: Actor.player1 }));
      done();
    });

    Actor.player1.perform('compete');
  });
});
