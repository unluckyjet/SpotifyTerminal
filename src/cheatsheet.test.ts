import {test,expect} from 'bun:test';
import {cheatSheetLines,defaultCheatRows,type CheatRow} from './cheatsheet';

function column(rows:CheatRow[]){return Math.max(0,...rows.map(r=>r.key.length))+2;}

test('cheat sheet lists transport keys, pads KEY  action, and appends extras',()=>{
  const rows=defaultCheatRows();
  const by=Object.fromEntries(rows.map(r=>[r.key,r.action.toLowerCase()]));
  expect(by.Space).toContain('play');expect(by.Space).toContain('pause');
  expect(by.Q).toContain('quit');
  expect(by['Left/Right']).toContain('skip');
  expect(by['Up/Down']).toContain('seek');
  expect(by['/']).toContain('command');
  const lines=cheatSheetLines();
  expect(lines).toHaveLength(rows.length);
  const col=column(rows);
  for(const [i,row] of rows.entries()){
    expect(lines[i].startsWith(row.key)).toBe(true);
    expect(lines[i].slice(0,col-2)).toBe(row.key.padEnd(col-2));
    expect(lines[i].slice(col-2,col)).toBe('  ');
    expect(lines[i].slice(col)).toBe(row.action);
  }
  const extra:CheatRow[]=[{key:'?',action:'toggle cheat sheet'},{key:'Shift+VeryLongBinding',action:'demo'}];
  const withExtra=cheatSheetLines(extra);
  expect(withExtra).toHaveLength(rows.length+extra.length);
  const wide=column([...rows,...extra]);
  expect(withExtra[0].slice(wide)).toBe(rows[0].action);
  expect(withExtra.at(-2)!.slice(wide)).toBe(extra[0].action);
  expect(withExtra.at(-1)).toBe(`${extra[1].key.padEnd(wide-2)}  ${extra[1].action}`);
  expect(cheatSheetLines([])).toEqual(lines);
  rows.push({key:'X',action:'mutated'});
  expect(defaultCheatRows().some(r=>r.key==='X')).toBe(false);
});
