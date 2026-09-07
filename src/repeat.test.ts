import {test,expect} from 'bun:test';
import {REPEAT_ORDER,cycleRepeat,formatRepeatBadge,repeatScript,parseRepeatFlag,type RepeatMode} from './repeat';
test('repeat cycles off, context, and track with AppleScript and badges',()=>{
  expect(REPEAT_ORDER).toEqual(['off','context','track']);
  let mode:RepeatMode='off';const seen:RepeatMode[]=[mode];
  for(let i=0;i<REPEAT_ORDER.length;i++){mode=cycleRepeat(mode);seen.push(mode);}
  expect(seen).toEqual([...REPEAT_ORDER,'off']);
  expect(formatRepeatBadge('off')).toBe('');expect(formatRepeatBadge('context')).toBe('repeat');expect(formatRepeatBadge('track')).toBe('repeat one');
  expect(repeatScript('off')).toBe('set repeating to false');
  expect(repeatScript('context')).toBe('set repeating to true');
  expect(repeatScript('track')).toBe('set repeating to true');
  expect(repeatScript('track')).not.toMatch(/repeat track|--/);
  expect(parseRepeatFlag(undefined)).toBe('off');expect(parseRepeatFlag('context')).toBe('context');expect(parseRepeatFlag('TRACK')).toBe('track');
  for(const value of ['','one','repeat track','shuffle','on'])expect(()=>parseRepeatFlag(value)).toThrow();
});
