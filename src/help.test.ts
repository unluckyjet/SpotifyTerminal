import {test, expect} from 'bun:test';
import {helpText, wantsHelp, wantsVersion} from './help';
test('help text names demo, transport, and new flags', () => {
  const text = helpText();
  expect(text).toContain('--demo');
  expect(text).toContain('Space: play/pause');
  expect(text).toContain('Q: quit');
  for (const flag of ['--version', '--once', '--repeat', '--sleep', '--night', '--high-contrast', '--mono', '--vim', '--compact', '--pomodoro', '--notify', '--status-file', '--json', '--volume']) {
    expect(text).toContain(flag);
  }
  expect(wantsHelp(['--help'])).toBe(true);
  expect(wantsHelp(['--demo'])).toBe(false);
  expect(wantsVersion(['--version'])).toBe(true);
});
