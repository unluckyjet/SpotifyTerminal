import {test,expect} from 'bun:test';
import {deuteranopiaTheme} from './colorblind';
test('deuteranopiaTheme remaps a green accent and keeps a blue accent without mutating input',()=>{
  const green={bg:'#101010',text:'#eeeeee',accent:'#22cc33',muted:'#888888',surface:'#1a1a1a'};
  const copy={...green};
  const remapped=deuteranopiaTheme(green);
  expect(green).toEqual(copy);
  expect(remapped).not.toBe(green);
  expect(remapped.accent).toBe('#f0c400');
  expect(remapped.bg).toBe(green.bg);expect(remapped.text).toBe(green.text);expect(remapped.muted).toBe(green.muted);
  expect(remapped.surface).toBe('#1a1a1a');
  const blue={bg:'#0a0a12',text:'#f4f4ff',accent:'#3366ff',muted:'#7788aa'};
  const kept=deuteranopiaTheme(blue);
  expect(kept.accent).toBe(blue.accent);
  expect(kept).toEqual(blue);
  expect(kept).not.toBe(blue);
});
