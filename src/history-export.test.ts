import {test,expect} from 'bun:test';
import {exportHistory,type HistoryRow} from './history-export';
function parseCsv(text:string){
  const rows:string[][]=[];let row:string[]=[],field='',i=0,quoted=false;
  const push=()=>{row.push(field);field='';};
  while(i<text.length){
    const c=text[i];
    if(quoted){
      if(c==='"'&&text[i+1]==='"'){field+='"';i+=2;continue;}
      if(c==='"'){quoted=false;i++;continue;}
      field+=c;i++;continue;
    }
    if(c==='"'){quoted=true;i++;continue;}
    if(c===','){push();i++;continue;}
    if(c==='\r'&&text[i+1]==='\n'){push();rows.push(row);row=[];i+=2;continue;}
    if(c==='\n'||c==='\r'){push();rows.push(row);row=[];i++;continue;}
    field+=c;i++;
  }
  if(quoted)throw new Error('unterminated quote');
  if(field.length||row.length){push();rows.push(row);}
  return rows;
}
const rows:HistoryRow[]=[
  {id:'abc',name:'Song',artist:'Artist',album:'Album',playedAt:'2024-01-01T00:00:00.000Z'},
  {id:'spotify:track:xyz',name:'He said "hi"',artist:'A, B',album:'Line\nbreak',playedAt:'t,1'},
];
test('exportHistory writes csv json and m3u, escapes RFC4180, and rejects unknown formats',()=>{
  const csv=exportHistory(rows,'csv');
  expect(csv.startsWith('id,name,artist,album,playedAt\r\n')).toBe(true);
  expect(csv).toContain('\r\n');
  expect(csv).toContain('"He said ""hi"""');
  expect(csv).toContain('"A, B"');
  expect(csv).toContain('"Line\nbreak"');
  expect(csv).toContain('"t,1"');
  const parsed=parseCsv(csv);
  expect(parsed[0]).toEqual(['id','name','artist','album','playedAt']);
  expect(parsed.slice(1)).toEqual(rows.map(e=>[e.id,e.name,e.artist,e.album,e.playedAt]));
  expect(exportHistory([],'csv')).toBe('id,name,artist,album,playedAt');
  expect(exportHistory(rows,'json')).toBe(JSON.stringify(rows));
  expect(exportHistory([],'json')).toBe(JSON.stringify([]));
  const m3u=exportHistory(rows,'m3u');
  expect(m3u).toBe('#EXTM3U\n#EXTINF:-1,Artist - Song\nspotify:track:abc\n#EXTINF:-1,A, B - He said "hi"\nspotify:track:xyz');
  expect(exportHistory([],'m3u')).toBe('#EXTM3U');
  expect(exportHistory([{...rows[0],id:'spotify:track:abc'}],'m3u')).toBe('#EXTM3U\n#EXTINF:-1,Artist - Song\nspotify:track:abc');
  expect(()=>exportHistory(rows,'xml' as never)).toThrow();
});
