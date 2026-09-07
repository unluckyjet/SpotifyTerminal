import {test, expect} from 'bun:test';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
test('index.ts imports every pitch module on the real CLI path', async () => {
  const src = await readFile(join(import.meta.dir, 'index.ts'), 'utf8');
  const modules = [
    'repeat','mute','share','uri','session-stats','play-counts','skips','bookmarks','ab-loop','jump',
    'replay','vim-keys','cheatsheet','config','keymap','history-export','history-search','history-group',
    'charts','streak','wrapped','heatmap','favorites','ratings','blocklist','queue','sleep-timer','night-mode',
    'fade','meta','notify','identicon','scrobble','ipc','status-file','version','once','retry','debounce',
    'lyrics-offset','srt','pomodoro','restore','help','cli-args','status-line',
    'relative-time','sanitize','mood','youtube','clock-overlay','auto-pause','volume-lock','smart-rewind',
    'shuffle-bag','week-stats','first-seen','macros','palette-history','podcast-skip','volume-label',
    'duplicates','m3u-import','crossfade','resume-track','album-progress','seek-rate','shuffle-seed','energy','quit-guard',
    'parse-duration','unicode-bar','ring','featuring','volume-curve','bytes','fuzzy','ttl-cache','wrap','same-track','dt',
    'csv','hex','readable','rate-limit','normalize','hash-color','parse-volume','undo','play-badge','parse-int','title','eta',
    'parse-duration',
  ];
  for (const name of modules) expect(src).toContain(`from './${name}'`);
  const scrobble = await readFile(join(import.meta.dir, 'scrobble.ts'), 'utf8');
  expect(scrobble).toContain(`from './jsonl'`);
  const ver = await readFile(join(import.meta.dir, 'version.ts'), 'utf8');
  expect(ver).toContain(`from './semver'`);
  const ui = await readFile(join(import.meta.dir, 'ui.ts'), 'utf8');
  for (const name of ['remaining','progress','seek-click','compact','contrast','mono','idle','colorblind']) {
    expect(ui).toContain(`from './${name}'`);
  }
});
