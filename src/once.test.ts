import {test,expect} from 'bun:test';
import {formatOnce} from './once';
const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
test('formatOnce prints ▶/Ⅱ text by default and JSON.stringify of now-playing fields',()=>{
  const track={name:'Go To Town',artist:'Doja Cat',album:'Amala',playing:true,position:15,duration:217};
  const line=(t:typeof track)=>`${t.playing?'▶':'Ⅱ'} ${t.name} — ${t.artist} — ${t.album} (${clock(t.position)}/${clock(t.duration)})`;
  expect(formatOnce(track)).toBe(line(track));
  expect(formatOnce(track,'text')).toBe(formatOnce(track));
  expect(formatOnce(track).startsWith('▶ ')).toBe(true);
  expect(formatOnce(track).includes('—')).toBe(true);
  const paused={...track,playing:false};
  expect(formatOnce(paused)).toBe(line(paused));
  expect(formatOnce(paused).startsWith('Ⅱ ')).toBe(true);
  const fields={name:track.name,artist:track.artist,album:track.album,playing:track.playing,position:track.position,duration:track.duration};
  expect(formatOnce(track,'json')).toBe(JSON.stringify(fields));
  expect(JSON.parse(formatOnce({...track,id:'demo',volume:65} as typeof track & {id:string;volume:number},'json'))).toEqual(fields);
  expect(formatOnce(paused,'json')).toBe(JSON.stringify({...fields,playing:false}));
  for(const [position,duration] of [[0,0],[0,59],[59.9,60],[61,200],[195,217],[-5,90],[10,-3],[125.4,180]] as [number,number][]){
    const t={...track,position,duration};
    expect(formatOnce(t)).toBe(line(t));
    expect(JSON.parse(formatOnce(t,'json'))).toEqual({name:t.name,artist:t.artist,album:t.album,playing:t.playing,position,duration});
  }
});
