const { AbortError } = require('../src/Error');
const Action = require('../src/Action');
const Stream = require('../src/Stream');
const { timeout } = require('../src/Util');

describe('Engine', () => {
  // Action steps
  const warmup = jest.fn(() => timeout(100).then(() => ({ warm: true })));
  const run = jest.fn(() => timeout(250).then(() => ({ ran: true })));
  const look = jest.fn(() => ({ looked: true }));
  const stretch = jest.fn(() => timeout(150).then(() => ({ stretched: true })));
  const abort = jest.fn((data, context) => context.abort('monklike'));

  // Asserters
  const assertParameters = () => {
    expect(warmup).toHaveBeenCalledWith({ actor: 'me' }, expect.objectContaining({ abort: expect.any(Function) }));
    expect(run).toHaveBeenCalledWith({ warm: true }, expect.objectContaining({ abort: expect.any(Function) }));
    expect(look).toHaveBeenCalledWith({ ran: true }, expect.objectContaining({ abort: expect.any(Function) }));
    expect(stretch).toHaveBeenCalledWith({ looked: true }, expect.objectContaining({ abort: expect.any(Function) }));
  };

  const assertAbort = () => {
    expect(warmup).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(look).not.toHaveBeenCalled();
    expect(stretch).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    warmup.mockClear();
    stretch.mockClear();
    look.mockClear();
    run.mockClear();
    abort.mockClear();
  });

  describe('Action', () => {
    test('define', () => {
      Action.define('compete', [warmup, run, look, stretch]);
      expect(Action.compete).toBeDefined();
      expect(Action.compete instanceof Action).toBe(true);
    });

    test('parameters', async () => {
      const data = await Action.compete({ actor: 'me' });
      assertParameters();
      expect(data).toEqual({ stretched: true });
    });

    test('result', async () => {
      const action = new Action('test', [
        () => 1,
        () => undefined,
      ]);
      expect(await action()).toBe(1);
    });

    test('abort', async () => {
      const promise = Action.compete({ actor: 'you' });
      promise.abort('selfish');
      const data = await promise;
      await (timeout(500));
      assertAbort();
      expect(data).toBeInstanceOf(AbortError);
      expect(promise.aborted).toBe(true);
      expect(promise.reason).toBe('selfish');
      expect(promise.started).toBe(false);
    });

    test('inline abort', async () => {
      const promise = new Action('', run, abort, stretch)();
      await promise;
      expect(run).toHaveBeenCalled();
      expect(abort).toHaveBeenCalled();
      expect(stretch).not.toHaveBeenCalled();
      expect(promise.aborted).toBe(true);
      expect(promise.reason).toBe('monklike');
      expect(promise.started).toBe(true);
    });

    test('listener', async () => {
      const listener = jest.fn(() => {});
      const data = await Action.compete().listen(listener);
      expect(data).toEqual({ stretched: true });
      expect(listener).toHaveBeenCalledTimes(5);
    });

    test('abort listener', async () => {
      const listener = jest.fn((step, context) => {
        if (step === 4) context.abort();
      });
      await Action.compete().listen(listener);
      expect(warmup).toHaveBeenCalled();
      expect(run).toHaveBeenCalled();
      expect(look).toHaveBeenCalled();
      expect(stretch).not.toHaveBeenCalled();
      // expect(data).toEqual({ stretched: true });
      expect(listener).toHaveBeenCalledTimes(5);
    });
  });

  describe('Stream', () => {
    test('define', () => {
      Stream.define('test', () => {});
      expect(Stream.test).toBeDefined();
    });

    test('parameters', async () => {
      Stream.define('test', () => Action.compete({ actor: 'me' }));
      await timeout(500);
      assertParameters();
    });

    test('push', async () => {
      Stream.test.push(() => new Action('', abort)(1));
      await timeout(50);
      expect(abort).toHaveBeenCalledWith(1, expect.objectContaining({ abort: expect.any(Function) }));
    });

    test('abort', async () => {
      const stream = new Stream('', () => Action.compete({ actor: 'me' }));
      stream.abort();
      await timeout(500);
      assertAbort();
    });

    test('inline abort', async () => {
      Stream.define('test', () => new Action('', run, abort, stretch)());
      await timeout(500);
      expect(run).toHaveBeenCalled();
      expect(abort).toHaveBeenCalled();
      expect(stretch).not.toHaveBeenCalled();
    });
  });
});
