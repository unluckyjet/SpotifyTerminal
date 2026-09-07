import {test,expect} from 'bun:test';
import {sameTrack} from './same-track';

type T={id:string;name:string;artist:string};
const t=(id:string,name:string,artist:string):T=>({id,name,artist});
function want(a:T,b:T){
  return a.id&&b.id?a.id===b.id:a.name.toLowerCase()===b.name.toLowerCase()&&a.artist.toLowerCase()===b.artist.toLowerCase();
}

test('sameTrack is true when nonempty ids equal, else name+artist case-insensitive',()=>{
  const airbag=t('spotify:track:airbag','Airbag','Radiohead');
  const renamed=t('spotify:track:airbag','AIRBAG','RADIOHEAD');
  const remix=t('spotify:track:airbag-rmx','Airbag','Radiohead');
  const missing=t('','Airbag','Radiohead');
  const missingCase=t('','AIRBAG','radiohead');
  const other=t('','Creep','Radiohead');
  const pairs:[T,T][]=[
    [airbag,airbag],[airbag,renamed],[airbag,remix],[airbag,missing],[missing,missingCase],
    [missing,other],[missing,t('','Airbag','Portishead')],[t('','',''),t('','','')],
    [t('x','',''),t('x','Nope','Nope')],[t('x','',''),t('y','','')],
    [t('','Jóga','Björk'),t('','jóga','björk')],[t('1','A','B'),t('1','a','b')],
    [t('1','A','B'),t('2','A','B')],[t('','A','B'),t('1','A','B')],[t('','A','B'),t('1','X','Y')],
    [t('0','Zero','Z'),t('0','Other','O')],[t('id','Song','Artist'),t('ID','Song','Artist')],
    [t('','Song','Artist'),t('','song','ARTIST')],[t('demo','Go To Town','Doja Cat'),t('demo-2','Go To Town','Doja Cat')],
    [t('','Go To Town','Doja Cat'),t('','go to town','doja cat')],
  ];
  for(const [a,b] of pairs){
    expect(sameTrack(a,b)).toBe(want(a,b));
    expect(sameTrack(b,a)).toBe(sameTrack(a,b));
    expect(sameTrack(a,a)).toBe(true);
  }
  expect(sameTrack(airbag,renamed)).toBe(true);
  expect(sameTrack(airbag,remix)).toBe(false);
  expect(sameTrack(missing,missingCase)).toBe(true);
  expect(sameTrack(missing,other)).toBe(false);
  expect(sameTrack(t('','A','B'),t('1','A','B'))).toBe(true);
  expect(sameTrack(t('1','A','B'),t('2','A','B'))).toBe(false);
  expect(sameTrack({id:'1',name:'A',artist:'B',album:'OK Computer'},{id:'1',name:'Z',artist:'Y',album:'OKNOTOK'})).toBe(true);
  expect(sameTrack(t('demo','Go To Town','Doja Cat'),t('demo-2','Go To Town','Doja Cat'))).toBe(false);
  expect(sameTrack(t('','Go To Town','Doja Cat'),t('','go to town','doja cat'))).toBe(true);
});
