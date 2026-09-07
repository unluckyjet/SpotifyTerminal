import {test,expect} from 'bun:test';
import {parseSpotifyUri,formatSpotifyUri,openSpotifyUrl,type SpotifyRef} from './uri';
test('parses Spotify URIs and open.spotify.com links, formats both ways, and rejects garbage',()=>{
  const kinds=['track','album','playlist','artist','episode','show'] as const;
  const id='4iV5W9uYEdYUVa79Axb7Rh';
  for(const kind of kinds){
    const ref:SpotifyRef={kind,id};
    const uri=formatSpotifyUri(ref);
    const url=openSpotifyUrl(ref);
    expect(uri).toBe(`spotify:${kind}:${id}`);
    expect(url).toBe(`https://open.spotify.com/${kind}/${id}`);
    expect(parseSpotifyUri(uri)).toEqual(ref);
    expect(parseSpotifyUri(` ${uri} `)).toEqual(ref);
    expect(parseSpotifyUri(url)).toEqual(ref);
    expect(parseSpotifyUri(`${url}?si=abc&utm_source=share`)).toEqual(ref);
    expect(parseSpotifyUri(`${url}/#hash`)).toEqual(ref);
    expect(parseSpotifyUri(url.replace('https://','http://'))).toEqual(ref);
    expect(parseSpotifyUri(`spotify:${kind.toUpperCase()}:${id}`)).toEqual(ref);
  }
  const track=parseSpotifyUri(`https://open.spotify.com/track/${id}?si=xyz`);
  expect(track).toEqual({kind:'track',id});
  expect(track&&formatSpotifyUri(track)).toBe(`spotify:track:${id}`);
  expect(track&&openSpotifyUrl(track)).toBe(`https://open.spotify.com/track/${id}`);
  for(const garbage of ['','  ','not a uri','spotify:user:foo','spotify:track:','spotify:track:id:extra','spotify:local:file',
    'https://open.spotify.com/user/x','https://open.spotify.com/track/','https://open.spotify.com/track/abc/def',
    'https://example.com/track/'+id,'track:'+id,'spotify:track:bad-id','open.spotify.com/track/'+id]){
    expect(parseSpotifyUri(garbage)).toBeNull();
  }
});
