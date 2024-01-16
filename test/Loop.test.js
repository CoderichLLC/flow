const Loop = require('../src/Loop');
const Action = require('../src/Action');
const { timeout } = require('../src/Util');

describe('Loop', () => {
  test('loops', async () => {
    let num = 0;

    const action = new Action('loop', [
      (_, { abort }) => {
        timeout(3000).then(() => abort('timeout'));
      },
      new Loop(async (_, { abort }) => {
        await timeout(500);
        return num++;
      }),
    ]);

    await action();
    expect(num).toBeGreaterThan(2);
  });
});
