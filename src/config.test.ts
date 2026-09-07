import {test,expect} from 'bun:test';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ConfigFile,defaultConfig,mergeConfig,parseConfig} from './config';
test('parseConfig keeps valid keys, mergeConfig later wins, and ConfigFile roundtrips',async()=>{
  expect(defaultConfig).toEqual({transitions:false,fullscreen:false,overlay:true,menubar:true,systemMedia:false,vim:false,night:false,repeat:'off',volume:50});
  const parsed=parseConfig('{"overlay":false,"volume":80,"repeat":"track","vim":true,"unknown":1,"night":"yes","repeatMode":"context"}');
  expect(parsed).toEqual({overlay:false,volume:80,repeat:'track',vim:true});
  expect('unknown' in parseConfig('{"unknown":true,"volume":"50"}')).toBe(false);
  for(const raw of ['{"volume":-1}','{"volume":101}','{"volume":50.5}','{"repeat":"album"}','{"repeat":"OFF"}','{"vim":1}','{"overlay":"true"}','[]','null','nope'])expect(parseConfig(raw)).toEqual({});
  expect(parseConfig('{"repeat":"off","volume":0}').volume).toBe(0);
  expect(parseConfig('{"volume":100,"repeat":"context"}')).toEqual({volume:100,repeat:'context'});
  const merged=mergeConfig(defaultConfig,{volume:80,repeat:'track',overlay:false});
  expect(merged).toEqual({...defaultConfig,volume:80,repeat:'track',overlay:false});
  expect(mergeConfig({volume:1,vim:true},{volume:2}).volume).toBe(2);
  expect(mergeConfig({volume:1,vim:true},{volume:2}).vim).toBe(true);
  const directory=await mkdtemp(join(tmpdir(),'spotterminal-config-'));
  try{
    const file=new ConfigFile(directory);
    expect(await file.load()).toEqual(defaultConfig);
    await file.save({vim:true,volume:80,repeat:'track',overlay:false});
    expect(join(directory,'config.json')).toBe(join(file.directory,'config.json'));
    expect(parseConfig(await readFile(join(directory,'config.json'),'utf8'))).toEqual({...defaultConfig,vim:true,volume:80,repeat:'track',overlay:false});
    const restored=new ConfigFile(directory);
    expect(await restored.load()).toEqual({...defaultConfig,vim:true,volume:80,repeat:'track',overlay:false});
    await writeFile(join(directory,'config.json'),'{"volume":200,"overlay":false,"nope":1,"repeat":"track"}');
    expect(await restored.load()).toEqual({...defaultConfig,overlay:false,repeat:'track'});
    await writeFile(join(directory,'config.json'),'{not json');
    expect(await restored.load()).toEqual(defaultConfig);
  }finally{await rm(directory,{recursive:true,force:true});}
});
