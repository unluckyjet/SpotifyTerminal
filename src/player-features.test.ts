import {test, expect} from 'bun:test';
import {createTestRenderer} from '@opentui/core/testing';
import {PlayerUI} from './ui';
import {Demo} from './spotify';
import {seekFromClick} from './seek-click';
import {formatRemaining} from './remaining';
import {progressLabel} from './progress';
test('player frame shows demo track, remaining time, percent, and seek bar geometry', async () => {
  const t = await createTestRenderer({width: 110, height: 34});
  try {
    let seek = -1;
    const ui = new PlayerUI(t.renderer, () => {});
    ui.onSeek = p => { seek = p; };
    const track = await new Demo().read();
    ui.draw(track, undefined, true, '');
    await t.renderOnce();
    const frame = t.captureCharFrame();
    expect(frame).toContain('Go To Town');
    expect(frame).toContain('Doja Cat');
    expect(frame).toContain(formatRemaining(track.position, track.duration));
    expect(frame).toContain(progressLabel(track.position, track.duration));
    expect(ui.hits).toHaveLength(3);
    expect(ui.seekBar).toBeDefined();
    const bar = ui.seekBar!;
    const mid = seekFromClick(bar.x + Math.floor(bar.width / 2), {x: bar.x, width: bar.width}, bar.duration);
    if (mid === undefined) throw new Error('expected a seek position from the progress bar');
    expect(mid).toBeGreaterThan(0);
    await t.mockMouse.click(bar.x + Math.floor(bar.width / 2), bar.y);
    expect(seek).toBe(mid);
  } finally {
    t.renderer.destroy();
  }
});
