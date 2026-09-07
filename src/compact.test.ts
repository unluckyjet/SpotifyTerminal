import {test,expect} from 'bun:test';
import {layoutMode,type LayoutMode} from './compact';
const classify=(width:number,height:number):LayoutMode=>{
  const tiny=width<32||height<16;
  const compact=!tiny&&(width<60||height<20);
  return tiny?'tiny':compact?'compact':'full';
};
test('layoutMode is tiny under 32x16, compact under 60x20, else full',()=>{
  expect(layoutMode(31,16)).toBe('tiny');
  expect(layoutMode(32,15)).toBe('tiny');
  expect(layoutMode(0,0)).toBe('tiny');
  expect(layoutMode(40,12)).toBe('tiny');
  expect(layoutMode(100,10)).toBe('tiny');
  expect(layoutMode(20,40)).toBe('tiny');
  expect(layoutMode(32,16)).toBe('compact');
  expect(layoutMode(59,19)).toBe('compact');
  expect(layoutMode(40,18)).toBe('compact');
  expect(layoutMode(80,19)).toBe('compact');
  expect(layoutMode(59,30)).toBe('compact');
  expect(layoutMode(60,20)).toBe('full');
  expect(layoutMode(80,24)).toBe('full');
  expect(layoutMode(32,20)).toBe(layoutMode(59,20));
  expect(layoutMode(31,20)).not.toBe(layoutMode(32,20));
  expect(layoutMode(60,19)).not.toBe(layoutMode(60,20));
  expect(layoutMode(40,12)).not.toBe(layoutMode(40,18));
  const sizes:[[number,number],...[number,number][]]=[
    [31,100],[32,15],[31,15],[-1,40],[80,-2],[0,20],[40,12],[39,16],[32,16],[59,16],[32,19],[59,19],[80,19],[59,30],[40,18],[60,19],[59,20],[32,20],[60,20],[80,24],[120,40],[32.5,16.5],[59.9,19.9],[60,20.1],
  ];
  for(const [width,height] of sizes){
    const got=layoutMode(width,height);
    expect(got).toBe(classify(width,height));
    expect(['tiny','compact','full']).toContain(got);
  }
  for(const width of [31,32,59,60,80])for(const height of [15,16,19,20,24]){
    expect(layoutMode(width,height)).toBe(classify(width,height));
  }
});
