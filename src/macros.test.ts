import {test,expect} from 'bun:test';
import {parseMacro,expandMacros} from './macros';

test('parseMacro splits on commas/whitespace; expandMacros nests to depth 8, keeps unknowns, stops cycles',()=>{
  expect(parseMacro('quieter,quieter,pause')).toEqual(['quieter','quieter','pause']);
  expect(parseMacro('quieter quieter pause')).toEqual(['quieter','quieter','pause']);
  expect(parseMacro('  quieter, quieter\tpause\nnext  ')).toEqual(['quieter','quieter','pause','next']);
  expect(parseMacro('a,, ,b\tc')).toEqual(['a','b','c']);
  expect(parseMacro('')).toEqual([]);
  expect(parseMacro('  , \t\n,')).toEqual([]);
  expect(parseMacro('pause')).toEqual(['pause']);
  expect(parseMacro('seek:10,volume-5')).toEqual(['seek:10','volume-5']);

  expect(expandMacros({},'pause')).toEqual(['pause']);
  expect(expandMacros({fade:'quieter, unknown, pause'},'missing')).toEqual(['missing']);

  const fade='quieter, quieter\tpause';
  const map={fade,night:'fade mute',wind:'night,quieter',empty:', ,',self:'self'};
  expect(expandMacros(map,'fade')).toEqual(parseMacro(fade));
  expect(expandMacros(map,'night')).toEqual(['quieter','quieter','pause','mute']);
  expect(expandMacros(map,'wind')).toEqual(['quieter','quieter','pause','mute','quieter']);
  expect(expandMacros(map,'empty')).toEqual([]);
  expect(expandMacros({fade:'quieter,unknown,pause'},'fade')).toEqual(['quieter','unknown','pause']);

  const nested={a:'b c',b:'d',d:'e'};
  expect(expandMacros(nested,'a',1)).toEqual(['b','c']);
  expect(expandMacros(nested,'a',2)).toEqual(['d','c']);
  expect(expandMacros(nested,'a',3)).toEqual(['e','c']);
  expect(expandMacros(nested,'a',0)).toEqual(['a']);
  expect(expandMacros(nested,'a',-1)).toEqual(['a']);
  expect(expandMacros(nested,'a',NaN)).toEqual(['a']);

  const chain:Record<string,string>={};
  for(let i=0;i<12;i++)chain[`n${i}`]=`n${i+1}`;
  expect(expandMacros(chain,'n0',1)).toEqual(['n1']);
  expect(expandMacros(chain,'n0',8)).toEqual(['n8']);
  expect(expandMacros(chain,'n0')).toEqual(expandMacros(chain,'n0',8));
  expect(expandMacros(chain,'n0',9)).toEqual(['n9']);
  expect(expandMacros(chain,'n0',0)).toEqual(['n0']);

  const ping={ping:'pong',pong:'ping'};
  expect(expandMacros(ping,'ping')).toEqual(expandMacros(ping,'ping',8));
  expect(expandMacros(ping,'ping',8)).toEqual(['ping']);
  expect(expandMacros(ping,'ping',7)).toEqual(['pong']);
  expect(expandMacros(ping,'ping',1)).toEqual(['pong']);
  expect(expandMacros(ping,'self')).toEqual(['self']);
  expect(expandMacros(map,'self')).toEqual(['self']);
  expect(expandMacros(map,'self',3)).toEqual(['self']);

  const boom={a:'a a'};
  for(const d of [0,1,2,3,4])expect(expandMacros(boom,'a',d)).toEqual(Array(2**d).fill('a'));
  expect(expandMacros(boom,'a')).toEqual(expandMacros(boom,'a',8));
  expect(expandMacros(boom,'a').length).toBe(2**8);

  const snapshot={...map};
  expandMacros(map,'wind');
  expect(map).toEqual(snapshot);
});
