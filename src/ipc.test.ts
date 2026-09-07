import {test,expect} from 'bun:test';
import {parseIpc} from './ipc';

const bare=['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter','mute','quit'] as const;
const repeats=['off','context','track'] as const;

test('parseIpc trims, accepts allowed actions with typed args, and rejects unknown or bad input',()=>{
  expect(parseIpc('')).toBeNull();
  expect(parseIpc('   ')).toBeNull();
  expect(parseIpc('\n\t')).toBeNull();
  for(const action of bare){
    expect(parseIpc(action)).toEqual({action});
    expect(parseIpc(`  ${action}  `)).toEqual({action});
    expect(parseIpc(`\t${action}\n`)).toEqual({action});
    expect(parseIpc(`${action} extra`)).toBeNull();
    expect(parseIpc(action.toUpperCase())).toBeNull();
  }
  expect(parseIpc('seek 12.5')).toEqual({action:'seek',arg:12.5});
  expect(parseIpc('seek 1:23')).toEqual({action:'seek',arg:83});
  expect(parseIpc('  seek   0  ')).toEqual({action:'seek',arg:0});
  expect(parseIpc('seek 12')).toEqual({action:'seek',arg:12});
  expect(parseIpc('seek 0.25')).toEqual({action:'seek',arg:0.25});
  expect(parseIpc('volume 40')).toEqual({action:'volume',arg:40});
  expect(parseIpc(' volume\t0 ')).toEqual({action:'volume',arg:0});
  expect(parseIpc('volume 100')).toEqual({action:'volume',arg:100});
  for(const n of [0,1,40,99,100])expect(parseIpc(`volume ${n}`)).toEqual({action:'volume',arg:n});
  for(const mode of repeats){
    expect(parseIpc(`repeat ${mode}`)).toEqual({action:'repeat',arg:mode});
    expect(parseIpc(`  repeat   ${mode}  `)).toEqual({action:'repeat',arg:mode});
  }
  for(const line of [
    'unknown','play now','SEEK 12.5','seek','seek -1','seek 12.5.0','seek 12.','seek .5','seek 1e2','seek 12.5 extra',
    'volume','volume -1','volume 101','volume 40.0','volume 40.5','volume +40','volume 40 extra','volume 1000',
    'repeat','repeat cycle','repeat OFF','repeat track extra','mute 1','quit now','foo 1','seek 12 5','volume  40 1',
  ])expect(parseIpc(line)).toBeNull();
});
