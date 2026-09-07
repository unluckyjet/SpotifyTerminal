import {test,expect} from 'bun:test';
import {CommandPalette} from './palette';
test('palette filters aliases, navigates results, and only runs the chosen action',()=>{
  let chosen='';const p=new CommandPalette([{id:'next',label:'Next track',keywords:'skip',run:()=>{chosen='next';}},{id:'art',label:'Fullscreen artwork',keywords:'cover',run:()=>{chosen='art';}}]);
  p.edit('cover');expect(p.matches.map(c=>c.id)).toEqual(['art']);p.choose()?.run();expect(chosen).toBe('art');
  p.edit('');p.move(-1);expect(p.choose()?.id).toBe('art');expect(p.view(1).lines).toEqual(['Fullscreen artwork']);
  p.edit('does not exist');p.move(1);expect(p.choose()).toBeUndefined();expect(chosen).toBe('art');
});
