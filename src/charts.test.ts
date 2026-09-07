import {test,expect} from 'bun:test';
import {topTracks,topArtists} from './charts';
test('topTracks ranks by count then name, skips zeros, maps names, default 10',()=>{
  const many=Object.fromEntries(Array.from({length:15},(_,i)=>[`id${String.fromCharCode(97+i)}`,i===0?0:16-i]));
  const ranked=topTracks(many,{idb:'Beta',idc:'Alpha'});
  expect(ranked).toHaveLength(10);
  expect(ranked.every(row=>row.count!==0)).toBe(true);
  expect(ranked[0]).toEqual({id:'idb',name:'Beta',count:15});
  expect(ranked[1]).toEqual({id:'idc',name:'Alpha',count:14});
  expect(ranked.map(row=>row.count)).toEqual([...ranked].sort((a,b)=>b.count-a.count||(a.name<b.name?-1:1)).map(row=>row.count));
  const tied=topTracks({z:4,a:4,m:1},{z:'Zed',a:'Ace',m:'Mid'});
  expect(tied.map(row=>row.name)).toEqual(['Ace','Zed','Mid']);
  expect(topTracks({ghost:7,zero:0},{zero:'Nope'})).toEqual([{id:'ghost',name:'ghost',count:7}]);
  expect(topTracks({a:1,b:2},{},1)).toEqual([{id:'b',name:'b',count:2}]);
  expect(topTracks({a:1},{},0)).toEqual([]);
  expect(topTracks({},{})).toEqual([]);
});
test('topArtists sums counts with missing=1, ranks by count then artist, default 10',()=>{
  const entries=[
    {artist:'Zed',id:'t1'},{artist:'Ace',id:'t2'},{artist:'Ace',id:'t3'},
    {artist:'Bee',id:'missing'},{artist:'Zed',id:'t4'},
    ...Array.from({length:12},(_,i)=>({artist:`N${String(i).padStart(2,'0')}`,id:`n${i}`})),
  ];
  const counts={t1:3,t2:2,t3:4,t4:1,n0:8,n1:7,n2:6,n3:5,n4:4,n5:3,n6:2,n7:1};
  const ranked=topArtists(entries,counts);
  expect(ranked).toHaveLength(10);
  expect(ranked[0]).toEqual({artist:'N00',count:8});
  expect(ranked.find(row=>row.artist==='Ace')).toEqual({artist:'Ace',count:6});
  expect(ranked.find(row=>row.artist==='Zed')).toEqual({artist:'Zed',count:4});
  expect(ranked.find(row=>row.artist==='Bee')).toEqual({artist:'Bee',count:1});
  expect(topArtists([{artist:'B',id:'x'},{artist:'A',id:'y'}],{x:5,y:5}).map(row=>row.artist)).toEqual(['A','B']);
  expect(topArtists([{artist:'Solo',id:'none'}],{})).toEqual([{artist:'Solo',count:1}]);
  expect(topArtists([{artist:'A',id:'t'},{artist:'B',id:'u'}],{t:9,u:1},1)).toEqual([{artist:'A',count:9}]);
  expect(topArtists([],{})).toEqual([]);
});
