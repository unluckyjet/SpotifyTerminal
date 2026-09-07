import {test, expect} from 'bun:test';
import {composeStatus, transportMeta} from './status-line';
import {formatRepeatBadge} from './repeat';
import {formatRemaining} from './remaining';
import {progressLabel} from './progress';
test('composeStatus uses shipped badge helpers and prefers notices', () => {
  expect(composeStatus({notice: 'Saved postcard'})).toBe('Saved postcard');
  const line = composeStatus({demo: true, repeat: 'track', muted: true, shuffle: true, vim: true, sleep: 'Sleep 12:00'});
  expect(line).toContain(formatRepeatBadge('track'));
  expect(line).toContain('mute');
  expect(line).toContain('shuffle');
  expect(line).toContain('vim');
  expect(line).toContain('Sleep 12:00');
  expect(line).toContain('demo · no audio');
  const meta = transportMeta(15, 217);
  expect(meta).toContain(progressLabel(15, 217));
  expect(meta).toContain(formatRemaining(15, 217));
});
