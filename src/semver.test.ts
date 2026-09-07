import {test,expect} from 'bun:test';
import {compareSemver} from './semver';

function numericParts(version:string){
  const core=version.trim().replace(/^[vV]/,'').split(/[-+]/,1)[0]??'';
  return core.split('.').map(seg=>{
    const n=parseInt(seg,10);
    return Number.isFinite(n)&&n>=0?n:0;
  });
}
function expected(a:string,b:string){
  const left=numericParts(a);
  const right=numericParts(b);
  const n=Math.max(left.length,right.length);
  for(let i=0;i<n;i++){
    const da=left[i]??0;
    const db=right[i]??0;
    if(da!==db)return da<db?-1:1;
  }
  return 0;
}

test('compareSemver returns -1, 0, or 1 from numeric version parts',async()=>{
  const versions=[
    '0.0.1','0.1.0','1.0.0','1.0.1','1.9.0','1.10.0','1.10.1','2.0.0',
    '1','1.0','1.0.0.0','v1.0.0','V2.0.0','1.0.0-beta','1.2.3+build',
    '01.02.03','1.0.0-rc.1',' 1.2.3 ','9.9.9','10.0.0','1.9.9','1.10',
  ];
  for(const a of versions){
    expect(compareSemver(a,a)).toBe(0);
    for(const b of versions){
      const got=compareSemver(a,b);
      expect(got===-1||got===0||got===1).toBe(true);
      expect(got).toBe(expected(a,b));
      expect(compareSemver(b,a)).toBe(got===0?0:-got);
    }
  }
  expect(compareSemver('1.0.0','1.0.0')).toBe(0);
  expect(compareSemver('1.0.0','1.0.1')).toBe(-1);
  expect(compareSemver('1.0.1','1.0.0')).toBe(1);
  expect(compareSemver('1.9.0','1.10.0')).toBe(-1);
  expect(compareSemver('1.10.0','1.9.0')).toBe(1);
  expect(compareSemver('1.0','1.0.0')).toBe(0);
  expect(compareSemver('1','1.0.0')).toBe(0);
  expect(compareSemver('2.0.0','1.9.9')).toBe(1);
  expect(compareSemver('1.0.0','2.0.0')).toBe(-1);
  expect(compareSemver('v1.2.3','1.2.3')).toBe(0);
  expect(compareSemver('1.0.0-beta','1.0.0')).toBe(0);
  expect(compareSemver('01.2.3','1.2.3')).toBe(0);
  expect(compareSemver('1.2.3','1.2.3.1')).toBe(-1);
  expect(compareSemver('1.2.3.1','1.2.3')).toBe(1);
  const pkg=JSON.parse(await Bun.file('package.json').text()) as {version:string};
  expect(compareSemver(pkg.version,pkg.version)).toBe(0);
  expect(compareSemver(pkg.version,'999.0.0')).toBe(-1);
  expect(compareSemver('999.0.0',pkg.version)).toBe(1);
  expect(compareSemver(pkg.version,'0.0.1')).toBe(1);
});
