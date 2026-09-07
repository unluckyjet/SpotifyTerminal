import {test,expect} from 'bun:test';
import {createTestRenderer} from '@opentui/core/testing';
import {PlayerUI,clock} from './ui';
import {Demo} from './spotify';
test('transport pauses, skips, clamps seeks and volume',async()=>{const d=new Demo();await d.command('toggle');const before=(await d.read()).position;await Bun.sleep(30);expect((await d.read()).position).toBe(before);await d.command('next');expect(d.track.position).toBe(0);await d.command('back');expect(d.track.position).toBe(0);for(let i=0;i<30;i++)await d.command('louder');expect(d.track.volume).toBe(100);await d.command('shuffle');expect(d.track.shuffle).toBe(true);expect(clock(195)).toBe('3:15');});
test('OpenTUI renders full, compact, and undersized layouts',async()=>{const t=await createTestRenderer({width:110,height:34});try{const ui=new PlayerUI(t.renderer,()=>{});const track=await new Demo().read();ui.draw(track,undefined,true,'');await t.renderOnce();let frame=t.captureCharFrame();expect(frame).toContain('0:15');expect(frame).toContain('3:37');expect(frame).not.toContain('SPOTTERMINAL');expect(ui.hits).toHaveLength(3);expect(frame).toContain('Go To Town');expect(frame).toContain('Amala • Demo tape');expect(frame).toContain('Doja Cat');expect(ui.hits[1].x-ui.hits[0].x).toBe(ui.hits[2].x-ui.hits[1].x);await Bun.write('preview.txt',frame);t.resize(70,30);ui.draw(track,undefined,true,'');await t.renderOnce();expect(t.captureCharFrame()).toContain('3:37');t.resize(24,12);ui.draw(track,undefined,true,'');await t.renderOnce();expect(t.captureCharFrame()).toContain('Resize terminal');}finally{t.renderer.destroy();}});

test('clicking transport invokes its command; static layout is stable',async()=>{const t=await createTestRenderer({width:110,height:34});try{let command='';const ui=new PlayerUI(t.renderer,c=>{command=c;});const track=await new Demo().read();ui.draw(track,undefined,true,'');await t.renderOnce();const before=t.captureCharFrame();const hit=ui.hits.find(h=>h.command==='toggle')!;await t.mockMouse.click(hit.x+1,hit.y);expect(command).toBe('toggle');ui.draw(track,undefined,true,'');await t.renderOnce();expect(t.captureCharFrame()).toBe(before);}finally{t.renderer.destroy();}});

test('album palette follows cover colors and keeps text readable',async()=>{
  const {albumTheme}=await import('./theme');
  const red=albumTheme(Buffer.from([220,30,20,220,30,20]));
  const blue=albumTheme(Buffer.from([20,30,220,20,30,220]));
  expect(red.accent).not.toBe(blue.accent);
  const luminance=(hex:string)=>{const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;};
  for(const theme of [red,blue,albumTheme(Buffer.from([0,0,0])),albumTheme(Buffer.from([255,255,255])),albumTheme()]){
    for(const foreground of [theme.text,theme.muted,theme.accent])expect((luminance(foreground)+0.05)/(luminance(theme.bg)+0.05)).toBeGreaterThan(4.5);
  }
});

test('original cover selects native images or a visible adaptive fallback',async()=>{
  const sharp=(await import('sharp')).default;
  const {setRendererCapabilities}=await import('@opentui/core/testing');
  const encoded=await sharp({create:{width:192,height:192,channels:3,background:'#dc3018'}}).png().toBuffer();
  const artwork={encoded,palette:Buffer.from([220,48,24])};
  const t=await createTestRenderer({width:80,height:34});
  try{
    const ui=new PlayerUI(t.renderer,()=>{});
    const track=await new Demo().read();
    setRendererCapabilities(t.renderer,{kitty_graphics:true,sixel:false,image_protocol:'auto'});
    ui.draw(track,artwork,false,'');
    await ui.cover.loadPromise;
    await t.renderOnce();
    expect(ui.cover.image?.width).toBe(192);
    expect(ui.cover.image?.height).toBe(192);
    expect(ui.cover.fit).toBe('fit');
    expect(ui.cover.effectiveProtocol).toBe('kitty');
    expect(ui.cover.visible).toBe(true);
    expect(t.captureCharFrame()).not.toContain('▀');
    setRendererCapabilities(t.renderer,{kitty_graphics:false,sixel:false,image_protocol:'auto'});
    ui.draw(track,artwork,false,'');await t.renderOnce();
    expect(ui.cover.visible).toBe(true);
    expect(t.captureCharFrame()).not.toContain('Album images need');
    expect(t.captureCharFrame()).toMatch(/[█▀▄▌▐▖▗▘▙▚▛▜▝▞▟]/);
    // Sixel falls back to a visible approximation while pixel geometry is unknown.
    setRendererCapabilities(t.renderer,{kitty_graphics:false,sixel:true,image_protocol:'sixel'});
    ui.draw(track,artwork,false,'');await t.renderOnce();
    expect(ui.cover.effectiveProtocol).toBe('blocks');
    expect(ui.cover.visible).toBe(true);
    const smaller=ui.cover.height;
    t.resize(140,60);ui.draw(track,artwork,false,'');await t.renderOnce();
    expect(ui.cover.height).toBeGreaterThan(smaller);
    expect(ui.cover.image?.width).toBe(192);
    // Clearing a track clears the old decoded cover as well.
    ui.draw(track,undefined,false,'');
    expect(ui.cover.source).toBeUndefined();
    expect(ui.cover.image).toBeNull();
  }finally{t.renderer.destroy();}
});

test('fallback averages fine detail instead of dropping it during downsampling',async()=>{
  const {NativeImage}=await import('@opentui/core');
  const {CoverRenderable}=await import('./cover');
  const raw=Buffer.alloc(8*8*4);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const i=(y*8+x)*4,v=(x+y)%2?255:0;
    raw[i]=raw[i+1]=raw[i+2]=v;raw[i+3]=255;
  }
  const source=NativeImage.fromRgba(raw,8,8);
  const t=await createTestRenderer({width:4,height:4});
  try{
    const cover=new CoverRenderable(t.renderer,{id:'fine-cover',source,width:2,height:1,protocol:'blocks',fit:'fit'});
    t.renderer.root.add(cover);await cover.loadPromise;await t.renderOnce();
    const colors=t.captureSpans().lines[0].spans.flatMap(span=>[span.fg,span.bg]);
    // Linear-light averaging of equal black/white samples encodes near sRGB 188.
    expect(colors.some(c=>c.toInts().slice(0,3).every(v=>Math.abs(v-188)<=2))).toBe(true);
  }finally{t.renderer.destroy();source.dispose();}
});

test('fullscreen artwork grows and hides idle controls while retaining the progress anchor',async()=>{
  const t=await createTestRenderer({width:100,height:40});
  try{
    const ui=new PlayerUI(t.renderer,()=>{}),track=await new Demo().read();
    const sharp=(await import('sharp')).default;
    const artwork={encoded:await sharp({create:{width:64,height:64,channels:3,background:'#6688aa'}}).png().toBuffer(),palette:Buffer.from([102,136,170])};
    ui.draw(track,artwork,false,'');await t.renderOnce();const normal=ui.cover.height;
    ui.toggleFullscreen();ui.lastInteraction=Date.now()-5000;
    ui.draw(track,artwork,false,'');await t.renderOnce();
    expect(ui.cover.height).toBeGreaterThan(normal);expect(ui.hits).toHaveLength(0);
    expect(t.captureCharFrame()).not.toContain(track.artist);expect(t.captureCharFrame()).toContain('────');
    ui.interact();ui.draw(track,artwork,false,'');await t.renderOnce();expect(ui.hits).toHaveLength(3);
  }finally{t.renderer.destroy();}
});
