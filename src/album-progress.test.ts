import {test,expect} from 'bun:test';
import {albumProgress} from './album-progress';
test('albumProgress counts unique ids per album in first-seen order',()=>{
  const entries=[
    {album:'OK Computer',id:'airbag'},
    {album:'Homogenic',id:'joga'},
    {album:'OK Computer',id:'airbag'},
    {album:'Kid A',id:'eitrp'},
    {album:'OK Computer',id:'paranoid'},
    {album:'Homogenic',id:'unravel'},
    {album:'Homogenic',id:'joga'},
    {album:'Kid A',id:'idioteque'},
  ];
  const rows=albumProgress(entries);
  expect(rows.map(r=>r.album)).toEqual(['OK Computer','Homogenic','Kid A']);
  expect(rows.map(r=>r.tracks)).toEqual([
    new Set(entries.filter(e=>e.album==='OK Computer').map(e=>e.id)).size,
    new Set(entries.filter(e=>e.album==='Homogenic').map(e=>e.id)).size,
    new Set(entries.filter(e=>e.album==='Kid A').map(e=>e.id)).size,
  ]);
  expect(albumProgress([])).toEqual([]);
  const sameId=[{album:'A',id:'x'},{album:'B',id:'x'},{album:'A',id:'y'}];
  expect(albumProgress(sameId)).toEqual([{album:'A',tracks:2},{album:'B',tracks:1}]);
  const snapshot=entries.map(e=>({...e}));
  albumProgress(entries);
  expect(entries).toEqual(snapshot);
  expect(albumProgress([{album:'Solo',id:'one'}])).toEqual([{album:'Solo',tracks:1}]);
});
