const Step = require('../src/Step');
const Action = require('../src/Action');
const { timeout } = require('../src/Util');

describe('Step', () => {
  test('awaits till the end', async () => {
    const spy = jest.fn();

    const action = new Action('step', [
      new Step(async (_, { abort }) => {
        abort();
        await timeout(3000);
        spy();
      }),
    ]);

    await action();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
