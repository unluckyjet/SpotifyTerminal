import {test,expect} from 'bun:test';
import {shareText,shareUrl} from './share';
test('shareText uses an em dash and omits empty albums; shareUrl keeps or builds track links',()=>{
  const withAlbum={name:'Go To Town',artist:'Doja Cat',album:'Amala'};
  expect(shareText(withAlbum)).toBe(`${withAlbum.name} — ${withAlbum.artist} (${withAlbum.album})`);
  expect(shareText(withAlbum).includes('—')).toBe(true);
  expect(shareText({name:'Solo',artist:'Frank Ocean',album:''})).toBe('Solo — Frank Ocean');
  const https='https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
  expect(shareUrl(https)).toBe(https);
  const uri='spotify:album:3lS1y25WAhcqJDATJK70Mq';
  expect(shareUrl(uri)).toBe(uri);
  const raw='0VjIjW4KwUKR2eNjSRtU0D';
  expect(shareUrl(raw)).toBe(`https://open.spotify.com/track/${raw}`);
  expect(shareUrl('track:7qiZfU4dY1lWllzX7mPBI')).toBe('https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI');
  expect(shareUrl('id=track:abc123')).toBe('https://open.spotify.com/track/abc123');
});
