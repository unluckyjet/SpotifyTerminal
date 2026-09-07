import {test,expect} from 'bun:test';
import {splitArtists} from './featuring';

const seps=['feat.','feat','ft.','ft','featuring','&','and',','];
const leftover=/^(?:featuring|feat\.?|ft\.?|and|&|,)$/i;

test('splitArtists splits feat. ft. featuring & and commas, trims, drops empties',()=>{
  expect(splitArtists('Doja Cat')).toEqual(['Doja Cat']);
  expect(splitArtists('  Doja Cat  ')).toEqual(['Doja Cat']);
  expect(splitArtists('')).toEqual([]);
  expect(splitArtists('   ')).toEqual([]);
  expect(splitArtists('feat.')).toEqual([]);
  expect(splitArtists('&')).toEqual([]);

  const left='Drake';
  const right='Rihanna';
  for(const sep of seps){
    const got=splitArtists(`${left} ${sep} ${right}`);
    expect(got).toEqual([left,right]);
    expect(got).toHaveLength(2);
    expect(got[0]).toBe(left);
    expect(got[1]).toBe(right);
    for(const part of got){
      expect(part).toBe(part.trim());
      expect(part.length).toBeGreaterThan(0);
      expect(leftover.test(part)).toBe(false);
    }
  }

  for(const sep of ['FEAT.','FT.','FEATURING','AND','Feat.','Ft','Featuring','And']){
    expect(splitArtists(`A ${sep} B`)).toEqual(['A','B']);
  }

  expect(splitArtists('A,B,C')).toEqual(['A','B','C']);
  expect(splitArtists('A&B&C')).toEqual(['A','B','C']);
  expect(splitArtists('A feat.B')).toEqual(['A','B']);
  expect(splitArtists('A ft.B')).toEqual(['A','B']);
  expect(splitArtists(`${left} feat. ${right} & The Weeknd, SZA and Future`)).toEqual([left,right,'The Weeknd','SZA','Future']);
  expect(splitArtists('Doja Cat feat. SZA')).toEqual(['Doja Cat','SZA']);
  expect(splitArtists('A ft. B & C')).toEqual(['A','B','C']);
  expect(splitArtists('Solo')).toEqual(['Solo']);
  expect(splitArtists('Doja Cat (feat. Rico Nasty)')).toEqual(['Doja Cat','Rico Nasty']);
  expect(splitArtists('Doja Cat (ft. Rico Nasty)')).toEqual(['Doja Cat','Rico Nasty']);
  expect(splitArtists('A (featuring B) & C')).toEqual(['A','B','C']);
  expect(splitArtists('feat. Rico Nasty')).toEqual(['Rico Nasty']);
  expect(splitArtists('A feat. feat. B')).toEqual(['A','B']);
  expect(splitArtists('A, , B')).toEqual(['A','B']);
  expect(splitArtists('A & & B')).toEqual(['A','B']);
  expect(splitArtists('A & A')).toEqual(['A','A']);

  for(const intact of ['Anderson Paak','Soft Cell','The Feature','Craft Spells','After Hours','Sandra']){
    expect(splitArtists(intact)).toEqual([intact]);
  }
  expect(splitArtists('A with B')).toEqual(['A with B']);
});
