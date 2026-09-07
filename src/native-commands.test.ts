import {test,expect} from 'bun:test';
import {nativeCommand} from './native-commands';
test('native command messages are validated before controlling playback',()=>{
  expect(nativeCommand({command:'pause'})).toEqual({command:'pause'});
  expect(nativeCommand({command:'seek',position:42})).toEqual({command:'seek',position:42});
  for(const input of [{command:'seek',position:-1},{command:'seek',position:NaN},{command:'exec'},null,'play'])expect(nativeCommand(input)).toBeNull();
});
