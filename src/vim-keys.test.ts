import {test,expect} from 'bun:test';
import {vimCommand} from './vim-keys';
test('vim keys map hjkl space and 0, ignoring case',()=>{
  expect(vimCommand('h')).toBe('previous');expect(vimCommand('H')).toBe('previous');
  expect(vimCommand('j')).toBe('back');expect(vimCommand('J')).toBe('back');
  expect(vimCommand('k')).toBe('forward');expect(vimCommand('K')).toBe('forward');
  expect(vimCommand('l')).toBe('next');expect(vimCommand('L')).toBe('next');
  expect(vimCommand(' ')).toBe('toggle');expect(vimCommand('space')).toBe('toggle');expect(vimCommand('SPACE')).toBe('toggle');
  expect(vimCommand('0')).toBe('replay');
  expect(vimCommand('x')).toBeUndefined();expect(vimCommand('hh')).toBeUndefined();expect(vimCommand('')).toBeUndefined();
  expect(vimCommand('left')).toBeUndefined();
});
