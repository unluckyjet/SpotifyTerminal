import {test,expect} from 'bun:test';
import {parsePackageVersion,formatVersion,versionLine} from './version';
test('parses package.json version strings and formats name plus version',async()=>{
  expect(parsePackageVersion('{"version":"2.3.4"}')).toBe('2.3.4');
  expect(parsePackageVersion('{"name":"demo","version":"0.1.0-beta"}')).toBe('0.1.0-beta');
  expect(formatVersion('2.3.4')).toBe('spotterminal 2.3.4');
  expect(formatVersion('2.3.4','other')).toBe('other 2.3.4');
  for(const bad of ['{','[]','{}','{"version":1}','{"version":null}','{"version":{"n":"1"}}']){
    expect(()=>parsePackageVersion(bad)).toThrow();
  }
  const json=await Bun.file('package.json').text();
  const version=parsePackageVersion(json);
  const pkg=JSON.parse(json) as {name:string;version:string};
  expect(typeof version).toBe('string');
  expect(version).toBe(pkg.version);
  expect(formatVersion(version)).toBe(`spotterminal ${pkg.version}`);
  expect(formatVersion(version,pkg.name)).toBe(`${pkg.name} ${pkg.version}`);
  expect(versionLine(version)).toBe(formatVersion(version));
  expect(versionLine('1.0.0','2.0.0')).toContain('update 2.0.0');
  expect(versionLine('2.0.0','1.0.0')).toBe(formatVersion('2.0.0'));
});
