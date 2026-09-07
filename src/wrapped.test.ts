import {test,expect} from 'bun:test';
import {wrappedStats} from './wrapped';

type Row={id:string;artist:string;album:string;name:string;playedAt:string};
const row=(partial:Partial<Row>):Row=>({id:'id',artist:'artist',album:'album',name:'name',playedAt:'2024-01-01T00:00:00.000Z',...partial});

test('wrappedStats filters playedAt year and ranks listening recap',()=>{
  const empty={tracks:0,artists:0,albums:0,topArtist:'',topTrack:'',days:0};
  expect(wrappedStats([],2024)).toEqual(empty);
  expect(wrappedStats([row({playedAt:'2023-12-31T23:59:59.000Z'}),row({playedAt:'not-a-date'})],2024)).toEqual(empty);

  const year=[
    row({id:'a',artist:'Zebra',album:'One',name:'Late',playedAt:'2024-01-01T08:00:00.000Z'}),
    row({id:'a',artist:'Zebra',album:'One',name:'Late',playedAt:'2024-01-01T21:00:00.000Z'}),
    row({id:'b',artist:'Alpha',album:'One',name:'Early',playedAt:'2024-01-02T00:00:00.000Z'}),
    row({id:'c',artist:'Alpha',album:'Two',name:'Early',playedAt:'2024-07-04T18:00:00.000Z'}),
    row({id:'d',artist:'Beta',album:'Two',name:'Mid',playedAt:'2024-07-04T19:00:00.000Z'}),
    row({id:'e',artist:'Beta',album:'Three',name:'Other',playedAt:'2025-01-01T00:00:00.000Z'}),
  ];
  expect(wrappedStats(year,2024)).toEqual({tracks:4,artists:3,albums:2,topArtist:'Alpha',topTrack:'Early',days:3});
  expect(wrappedStats(year,2025)).toEqual({tracks:1,artists:1,albums:1,topArtist:'Beta',topTrack:'Other',days:1});

  const tied=[
    row({id:'1',artist:'B',name:'Z',playedAt:'2024-03-01T00:00:00.000Z'}),
    row({id:'2',artist:'A',name:'Y',playedAt:'2024-03-02T00:00:00.000Z'}),
  ];
  expect(wrappedStats(tied,2024)).toEqual({tracks:2,artists:2,albums:1,topArtist:'A',topTrack:'Y',days:2});

  const frequent=[
    row({id:'1',artist:'B',name:'Z',playedAt:'2024-05-01T00:00:00.000Z'}),
    row({id:'1',artist:'B',name:'Z',playedAt:'2024-05-02T00:00:00.000Z'}),
    row({id:'2',artist:'A',name:'Y',playedAt:'2024-05-03T00:00:00.000Z'}),
  ];
  expect(wrappedStats(frequent,2024)).toEqual({tracks:2,artists:2,albums:1,topArtist:'B',topTrack:'Z',days:3});
});
