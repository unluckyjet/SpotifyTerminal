import {test,expect} from 'bun:test';
import {parseTrackMeta,formatTrackMeta} from './meta';
test('parseTrackMeta reads optional fields and formatTrackMeta joins present parts',()=>{
  expect(parseTrackMeta(undefined)).toEqual({});
  expect(parseTrackMeta(null)).toEqual({});
  expect(parseTrackMeta('track')).toEqual({});
  expect(parseTrackMeta(12)).toEqual({});
  expect(parseTrackMeta(true)).toEqual({});
  expect(parseTrackMeta([])).toEqual({});
  const full={
    albumArtist:'Doja Cat',
    discNumber:12,
    trackNumber:3,
    popularity:72,
    starred:true,
    spotifyUrl:'https://open.spotify.com/track/abc',
    name:'Go To Town',
  };
  const parsed=parseTrackMeta(full);
  expect(parsed).toEqual({
    albumArtist:'Doja Cat',
    discNumber:12,
    trackNumber:3,
    popularity:72,
    starred:true,
    spotifyUrl:'https://open.spotify.com/track/abc',
  });
  expect(parsed).not.toHaveProperty('name');
  expect(parseTrackMeta({
    albumArtist:1,
    discNumber:'3',
    trackNumber:NaN,
    popularity:Infinity,
    starred:'yes',
    spotifyUrl:false,
  })).toEqual({});
  expect(parseTrackMeta({
    albumArtist:'A',
    discNumber:NaN,
    trackNumber:4,
    popularity:-Infinity,
    starred:false,
    spotifyUrl:'https://open.spotify.com/track/x',
  })).toEqual({albumArtist:'A',trackNumber:4,starred:false,spotifyUrl:'https://open.spotify.com/track/x'});
  expect(parseTrackMeta({albumArtist:'',discNumber:0,trackNumber:0,popularity:0,starred:false,spotifyUrl:''})).toEqual({
    albumArtist:'',discNumber:0,trackNumber:0,popularity:0,starred:false,spotifyUrl:'',
  });
  expect(parseTrackMeta({albumArtist:null,discNumber:1.5,trackNumber:2,popularity:0,starred:true,spotifyUrl:undefined,extra:{}})).toEqual({
    discNumber:1.5,trackNumber:2,popularity:0,starred:true,
  });
  expect(formatTrackMeta({trackNumber:3,discNumber:12,popularity:72,starred:true})).toBe('3/12 · pop 72 · ★');
  expect(formatTrackMeta(parseTrackMeta({trackNumber:3,discNumber:12,popularity:72,starred:true}))).toBe('3/12 · pop 72 · ★');
  expect(formatTrackMeta({})).toBe('');
  expect(formatTrackMeta({starred:false,albumArtist:'',spotifyUrl:''})).toBe('');
  expect(formatTrackMeta({popularity:72})).toBe('pop 72');
  expect(formatTrackMeta({starred:true})).toBe('★');
  expect(formatTrackMeta({trackNumber:5})).toBe('5');
  expect(formatTrackMeta({discNumber:2})).toBe('2');
  expect(formatTrackMeta({trackNumber:8,discNumber:1})).toBe('8/1');
  expect(formatTrackMeta({albumArtist:'Various',popularity:10})).toBe('Various · pop 10');
  expect(formatTrackMeta({spotifyUrl:'https://open.spotify.com/track/z'})).toBe('https://open.spotify.com/track/z');
  expect(formatTrackMeta({trackNumber:0,discNumber:0,popularity:0})).toBe('0/0 · pop 0');
  expect(formatTrackMeta(parsed)).toBe('Doja Cat · 3/12 · pop 72 · ★ · https://open.spotify.com/track/abc');
  expect(formatTrackMeta({popularity:parsed.popularity,starred:true})).toBe(`pop ${parsed.popularity} · ★`);
});
