import {test,expect} from 'bun:test';
import {parseM3U} from './m3u-import';
import {exportHistory,type HistoryRow} from './history-export';
import {PlayQueue} from './queue';
import {formatSpotifyUri,openSpotifyUrl} from './uri';

test('parseM3U reads EXTINF artist - name plus Spotify track URI or URL and skips comments/blank',()=>{
  const rows:HistoryRow[]=[
    {id:'4iV5W9uYEdYUVa79Axb7Rh',name:'Song',artist:'Artist',album:'Album',playedAt:'2024-01-01T00:00:00.000Z'},
    {id:'spotify:track:xyzXYZ0123456789abcd',name:'He said "hi"',artist:'A, B',album:'Line\nbreak',playedAt:'t,1'},
  ];
  const exported=exportHistory(rows,'m3u');
  const fromExport=parseM3U(exported);
  expect(fromExport).toEqual(rows.map(e=>({id:e.id.replace(/^spotify:track:/,''),name:e.name,artist:e.artist})));
  expect(parseM3U(exportHistory([],'m3u'))).toEqual([]);
  expect(parseM3U('')).toEqual([]);
  expect(parseM3U('\uFEFF#EXTM3U\n\n# comment\n   \n')).toEqual([]);

  const id='4iV5W9uYEdYUVa79Axb7Rh';
  const uri=formatSpotifyUri({kind:'track',id});
  const url=openSpotifyUrl({kind:'track',id});
  expect(parseM3U(`#EXTINF:-1,Radiohead - Karma Police\n${uri}`)).toEqual([{id,name:'Karma Police',artist:'Radiohead'}]);
  expect(parseM3U(`#EXTINF:321, Radiohead - Karma Police \n${url}?si=abc`)).toEqual([{id,name:'Karma Police',artist:'Radiohead'}]);
  expect(parseM3U(`#EXTM3U\r\n\r\n# skip\r\n#EXTINF:12,Bjork - Joga\r\n ${url} \r\n\r\n#EXTINF:-1,Massive Attack - Teardrop\r\n${uri}`)).toEqual([
    {id,name:'Joga',artist:'Bjork'},
    {id,name:'Teardrop',artist:'Massive Attack'},
  ]);
  expect(parseM3U(`#extinf:-1,Artist - Song\n${uri}`)).toEqual([{id,name:'Song',artist:'Artist'}]);
  expect(parseM3U(`#EXTINF:-1,Artist - Song\n\n# note\n${uri}`)).toEqual([{id,name:'Song',artist:'Artist'}]);

  expect(parseM3U(`#EXTINF:-1,NoSeparator\n${uri}`)).toEqual([]);
  expect(parseM3U(`#EXTINF:-1, - Song\n${uri}`)).toEqual([]);
  expect(parseM3U(`#EXTINF:-1,Artist - \n${uri}`)).toEqual([]);
  expect(parseM3U(`#EXTINF:-1,Artist - Song\nspotify:album:${id}`)).toEqual([]);
  expect(parseM3U(`#EXTINF:-1,Artist - Song\nhttps://example.com/track/${id}`)).toEqual([]);
  expect(parseM3U(uri)).toEqual([]);
  expect(parseM3U('#EXTINF:-1,Artist - Song')).toEqual([]);
  expect(parseM3U(`#EXTINF:-1,Keep - Me\nnot-a-uri\n${uri}`)).toEqual([]);

  const q=new PlayQueue();
  for(const item of fromExport)q.enqueue(item);
  expect(q.items).toEqual(fromExport);
  expect(q.peek()?.id).toBe(fromExport[0]?.id);
});
