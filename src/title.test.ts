import {test,expect} from 'bun:test';
import {windowTitle} from './title';

const controls='\u0000\u0007\u0008\u000b\u000c\u000e\u001b\u001f\u007f\u0080\u009f';
const leftover=/[\u0000-\u001f\u007f-\u009f]/;
const clean=(value:string)=>value.replace(/[\u0000-\u001f\u007f-\u009f]/g,'');
const clip=(value:string,max:number)=>Array.from(value).slice(0,Math.max(0,max)).join('');
function format(track:{name:string;artist:string},token:string){
  const suffix=` · ${clean(token)}`;
  const prefix=`${clean(track.name)} — ${clean(track.artist)}`;
  const room=Math.max(0,80-Array.from(suffix).length);
  return clip(prefix,room)+clip(suffix,80);
}

test('windowTitle is name — artist · token without controls, max 80',()=>{
  const track={name:'Go To Town',artist:'Doja Cat'};
  const token='spotterminal-ab12cd34';
  const title=windowTitle(track,token);
  expect(title).toBe(`${track.name} — ${track.artist} · ${token}`);
  expect(title).toBe(format(track,token));
  expect(title).toContain(' — ');
  expect(title).toContain(' · ');
  expect(title.includes(track.name)).toBe(true);
  expect(title.includes(track.artist)).toBe(true);
  expect(title.endsWith(token)).toBe(true);
  expect(title.indexOf(track.name)).toBeLessThan(title.indexOf(track.artist));
  expect(title.indexOf(track.artist)).toBeLessThan(title.indexOf(token));
  expect(leftover.test(title)).toBe(false);
  expect(Array.from(title).length).toBeLessThanOrEqual(80);

  const dirty={name:`  ${controls}Song\u0007`,artist:`Art${controls}ist\u001b`};
  const dirtyTok=`tok${controls}en\u0007`;
  const sanitized=windowTitle(dirty,dirtyTok);
  expect(sanitized).toBe(format(dirty,dirtyTok));
  expect(leftover.test(sanitized)).toBe(false);
  for(const ch of controls){
    expect(sanitized.includes(ch)).toBe(false);
    expect(windowTitle({name:`ok${ch}name`,artist:`ok${ch}artist`},`tok${ch}`).includes(ch)).toBe(false);
  }
  expect(sanitized).toContain(clean(dirty.name));
  expect(sanitized).toContain(clean(dirty.artist));
  expect(sanitized.endsWith(clean(dirtyTok))).toBe(true);
  expect(windowTitle({name:`A${controls}B`,artist:'C'},'t')).toBe('AB — C · t');

  const longName='n'.repeat(200);
  const longArtist='a'.repeat(80);
  const long=windowTitle({name:longName,artist:longArtist},token);
  expect(long).toBe(format({name:longName,artist:longArtist},token));
  expect(Array.from(long).length).toBe(80);
  expect(leftover.test(long)).toBe(false);
  expect(long.endsWith(` · ${token}`)).toBe(true);
  expect(long.startsWith('n')).toBe(true);
  expect(long.includes(token)).toBe(true);

  const emojiName='🎵'.repeat(100);
  const emoji=windowTitle({name:emojiName,artist:'x'},'t');
  expect(emoji).toBe(format({name:emojiName,artist:'x'},'t'));
  expect(Array.from(emoji).length).toBe(80);
  expect(emoji.endsWith(' · t')).toBe(true);
  expect(emoji.startsWith('🎵')).toBe(true);

  const hugeTok='k'.repeat(120);
  const huge=windowTitle({name:'Song',artist:'Artist'},hugeTok);
  expect(huge).toBe(format({name:'Song',artist:'Artist'},hugeTok));
  expect(Array.from(huge).length).toBe(80);
  expect(leftover.test(huge)).toBe(false);
  expect(huge.startsWith(' · ')).toBe(true);

  expect(windowTitle({name:'',artist:''},'')).toBe(' —  · ');
  expect(windowTitle({name:'Solo',artist:''},token)).toBe(`Solo —  · ${token}`);
});
