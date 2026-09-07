import {test,expect} from 'bun:test';
import {youtubeSearchUrl} from './youtube';
test('youtubeSearchUrl encodes artist then name as a YouTube results query',()=>{
  const prefix='https://www.youtube.com/results?search_query=';
  const tracks=[
    {name:'Go To Town',artist:'Doja Cat'},
    {name:'Solo',artist:'Frank Ocean'},
    {name:'C&C',artist:'A&B'},
    {name:'100%',artist:'Who?'},
    {name:'café #1',artist:'Señor'},
    {name:'a+b=c',artist:'x/y'},
    {name:'"quoted"',artist:"O'Brien"},
    {name:'',artist:''},
  ];
  for(const track of tracks){
    const url=youtubeSearchUrl(track);
    const query=`${track.artist} ${track.name}`;
    expect(url).toBe(`${prefix}${encodeURIComponent(query)}`);
    expect(url.startsWith(prefix)).toBe(true);
    const parsed=new URL(url);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('www.youtube.com');
    expect(parsed.pathname).toBe('/results');
    expect(parsed.searchParams.get('search_query')).toBe(query);
    expect(decodeURIComponent(url.slice(prefix.length))).toBe(query);
    const swapped=`${prefix}${encodeURIComponent(`${track.name} ${track.artist}`)}`;
    if(query!==`${track.name} ${track.artist}`)expect(url).not.toBe(swapped);
  }
  const demo={name:'Blinding Lights',artist:'The Weeknd'};
  const url=youtubeSearchUrl(demo);
  expect(url.includes(encodeURIComponent(demo.artist))).toBe(true);
  expect(url.includes(encodeURIComponent(demo.name))).toBe(true);
  expect(url.indexOf(encodeURIComponent(demo.artist))).toBeLessThan(url.indexOf(encodeURIComponent(demo.name)));
});
