import {createCliRenderer} from '@opentui/core';
import sharp from 'sharp';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {Spotify,Demo,type Command,type Track} from './spotify';
import {PlayerUI} from './ui';
import type {Artwork} from './cover';
import {ArtworkOverlay} from './overlay';
import {ListeningHistory,dataDirectory} from './history';
import {exportPostcard} from './postcard';
import {CommandPalette} from './palette';
import {LyricsLibrary} from './lyrics';
import {FocusTimer} from './focus';
import {helpText,wantsHelp,wantsVersion} from './help';
import {parseCliOptions} from './cli-args';
import {cycleRepeat,formatRepeatBadge,parseRepeatFlag,type RepeatMode} from './repeat';
import {MuteState} from './mute';
import {shareText,shareUrl} from './share';
import {parseSpotifyUri,formatSpotifyUri,openSpotifyUrl} from './uri';
import {SessionStats} from './session-stats';
import {PlayCounts} from './play-counts';
import {SkipLog,isSkip} from './skips';
import {BookmarkStore} from './bookmarks';
import {ABLoop} from './ab-loop';
import {jumpKey} from './jump';
import {replayPosition,shouldReplay} from './replay';
import {vimCommand} from './vim-keys';
import {cheatSheetLines,defaultCheatRows} from './cheatsheet';
import {ConfigFile,mergeConfig} from './config';
import {Keymap} from './keymap';
import {exportHistory} from './history-export';
import {searchHistory} from './history-search';
import {groupHistory} from './history-group';
import {topTracks,topArtists} from './charts';
import {listeningStreak} from './streak';
import {wrappedStats} from './wrapped';
import {hourHeatmap,formatHeatmap} from './heatmap';
import {FavoriteStore} from './favorites';
import {RatingStore} from './ratings';
import {Blocklist} from './blocklist';
import {PlayQueue,consumePlayNext} from './queue';
import {SleepTimer} from './sleep-timer';
import {isNight} from './night-mode';
import {fadeSteps} from './fade';
import {parseTrackMeta,formatTrackMeta} from './meta';
import {notifyPayload,notifyArgs} from './notify';
import {trackIdenticon} from './identicon';
import {ScrobbleLog} from './scrobble';
import {parseIpc} from './ipc';
import {formatStatusFile,statusFilePath} from './status-file';
import {parsePackageVersion,versionLine} from './version';
import {formatOnce} from './once';
import {RetryBudget,readWithRetry} from './retry';
import {CommandDebounce} from './debounce';
import {shiftLyrics,nudgeLyrics} from './lyrics-offset';
import {lyricsToSrt} from './srt';
import {Pomodoro} from './pomodoro';
import {SessionRestore} from './restore';
import {composeStatus} from './status-line';
import {relativeTime} from './relative-time';
import {sanitizeFilename} from './sanitize';
import {coverMood} from './mood';
import {youtubeSearchUrl} from './youtube';
import {wallClock} from './clock-overlay';
import {shouldAutoPause} from './auto-pause';
import {VolumeLock} from './volume-lock';
import {unpausePosition} from './smart-rewind';
import {ShuffleBag} from './shuffle-bag';
import {isoWeek,weekStats} from './week-stats';
import {FirstSeen} from './first-seen';
import {expandMacros,parseMacro} from './macros';
import {PaletteHistory} from './palette-history';
import {skipBy} from './podcast-skip';
import {volumeLabel} from './volume-label';
import {findDuplicates} from './duplicates';
import {parseM3U} from './m3u-import';
import {crossfadeMs} from './crossfade';
import {LastTrack,applyResume} from './resume-track';
import {albumProgress} from './album-progress';
import {seekRate} from './seek-rate';
import {seededShuffle} from './shuffle-seed';
import {coverEnergy} from './energy';
import {QuitGuard} from './quit-guard';
import {parseDuration} from './parse-duration';
import {parseIntStrict} from './parse-int';

import {unicodeBar} from './unicode-bar';
import {RingBuffer} from './ring';
import {splitArtists} from './featuring';
import {linearToLogVolume} from './volume-curve';
import {formatBytes} from './bytes';
import {fuzzyMatch} from './fuzzy';
import {TtlCache} from './ttl-cache';
import {wrapText} from './wrap';
import {sameTrack} from './same-track';
import {clampedDt} from './dt';

import {csvRow} from './csv';
import {parseHex,formatHex} from './hex';
import {readableText} from './readable';
import {RateLimit} from './rate-limit';
import {normalizeText} from './normalize';
import {hashColor} from './hash-color';
import {parseVolume} from './parse-volume';
import {UndoStack} from './undo';
import {playBadge} from './play-badge';

import {windowTitle} from './title';
import {etaClock} from './eta';


const args=process.argv.slice(2);
if(wantsHelp(args)){console.log(helpText());process.exit(0);}
if(wantsVersion(args)){
  const pkg=parsePackageVersion(await Bun.file(new URL('../package.json',import.meta.url)).text());
  console.log(versionLine(pkg,process.env.SPOTTERMINAL_LATEST));process.exit(0);
}
if(args.includes('--mini')){const {runMini}=await import('./mini');await runMini(args);}
if(args.includes('--lyrics')&&(!args[args.indexOf('--lyrics')+1]||args[args.indexOf('--lyrics')+1].startsWith('--'))){console.error('--lyrics needs a path to an .lrc file');process.exit(1);}
const options=parseCliOptions(args);
if(!options.demo&&process.platform!=='darwin'){console.error('Live playback requires Spotify for macOS. Try spotterminal --demo.');process.exit(1);}
const backend=options.demo?new Demo():new Spotify();
if(options.once){
  const track=await backend.read();
  console.log(formatOnce(track,options.json?'json':'text'));
  process.exit(0);
}
if(options.volume!==undefined)await backend.setVolume(options.volume);

const configFile=new ConfigFile(dataDirectory);
const restored=new SessionRestore(dataDirectory);
const saved=mergeConfig(await configFile.load(),{});
const session=await restored.load();
let repeat:RepeatMode=options.repeat??saved.repeat??session.repeat??'off';
let vim=options.vim||saved.vim||session.vim;
let night=options.night||saved.night||isNight(new Date().getHours());
const lyricsLibrary=new LyricsLibrary();
let lyricsTrack='',lyricsVersion=0,lyricsNudge=0;
let pendingLyricsPath=options.lyrics;
const history=new ListeningHistory();await history.load();
const focus=new FocusTimer();
if(options.focus!==undefined){try{focus.start(options.focus);}catch(e){console.error(String(e));process.exit(1);}}
const sleep=new SleepTimer();
if(options.sleep!==undefined){try{sleep.start(options.sleep);}catch(e){console.error(String(e));process.exit(1);}}
const pomodoro=new Pomodoro();
if(options.pomodoro)pomodoro.start();
const mute=new MuteState(saved.volume??session.volume);
const stats=new SessionStats();
const counts=new PlayCounts(dataDirectory);await counts.load();
const skips=new SkipLog(dataDirectory);await skips.load();
const bookmarks=new BookmarkStore(dataDirectory);await bookmarks.load();
const loop=new ABLoop();
const favorites=new FavoriteStore(dataDirectory);await favorites.load();
const ratings=new RatingStore(dataDirectory);await ratings.load();
const blocked=new Blocklist(dataDirectory);await blocked.load();
const queueList=new PlayQueue();
const scrobbles=new ScrobbleLog(dataDirectory);await scrobbles.load();
const keys=new Keymap();
try{keys.parse(await readFile(join(dataDirectory,'keymap.txt'),'utf8'));}catch{}
const debounce=new CommandDebounce();
const retries=new RetryBudget();
const volumeLock=new VolumeLock();
const quitGuard=new QuitGuard();
const firstSeen=new FirstSeen(dataDirectory);await firstSeen.load();
const lastTrack=new LastTrack(dataDirectory);
if(options.demo)await applyResume(await lastTrack.load(),id=>backend.playUri(id),pos=>backend.seek(pos));
const paletteHistory=new PaletteHistory();
const bag=new ShuffleBag(history.entries);
const recent=new RingBuffer<string>(12);
const undoSkip=new UndoStack<string>();
const artCache=new TtlCache<boolean>(60_000);
const artLimit=new RateLimit(8,1000);
let pausedAt=0;
let lastPollAt=Date.now();
const renderer=await createCliRenderer({exitOnCtrlC:false,useMouse:true});
let track:Track={id:'',name:'Connecting to Spotify…',artist:'',album:'',artwork:'',duration:0,position:0,playing:false,volume:0,shuffle:false};
let status='',cover:Artwork|undefined,artUrl='',closed=false,busy=false,lastNotified='';
async function artwork(url:string){
  if(url===artUrl)return;
  if(!url){artUrl='';cover=undefined;return;}
  if(artCache.get(url)===false)return;
  if(!artLimit.allow())return;
  artUrl=url;cover=undefined;
  try{
    const u=new URL(url);if(u.protocol!=='https:')return;
    const res=await fetch(u,{signal:AbortSignal.timeout(6000)});
    if(!res.ok)throw Error('Artwork unavailable');
    const encoded=Buffer.from(await res.arrayBuffer());
    const palette=await sharp(encoded).resize(32,32,{fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer();
    if(!closed && url===artUrl){cover={encoded,palette};artCache.set(url,true);}
  }catch{
    artCache.set(url,false);
    if(url===artUrl)artUrl='';
  }
}
async function poll(){
  if(busy||closed)return;busy=true;
  try{
    const previous=track;
    track=await readWithRetry(()=>backend.read(),retries,ms=>Bun.sleep(ms));
    status='';
    void artwork(track.artwork);
    stats.observe(track);
    void scrobbles.maybeRecord(track);
    if(track.id){void firstSeen.record(track.id);recent.push(track.id);}
    lastPollAt=Date.now()-clampedDt(lastPollAt,Date.now())*1000;
    if(previous.id&&!sameTrack(previous,track)){
      if(previous.playing&&isSkip(previous.position,previous.duration))void skips.record(previous.id,previous.position,previous.duration);
      if(track.playing&&track.id)void counts.record(track.id);
    }else if(track.playing&&track.id&&!previous.id)void counts.record(track.id);
    if(blocked.shouldSkip(track.id)){void action('next');}
    const wrapped=loop.wrap(track.position);
    if(loop.active()&&wrapped!==track.position)await backend.seek(wrapped);
    if(track.id!==lyricsTrack){
      lyricsTrack=track.id;const id=track.id,version=++lyricsVersion;ui.lyricLines=[];lyricsNudge=0;
      void lyricsLibrary.load(id).then(lines=>{if(version===lyricsVersion)ui.lyricLines=shiftLyrics(lines,lyricsNudge);});
      if(options.notify&&track.id&&track.id!==lastNotified){
        lastNotified=track.id;
        Bun.spawn(notifyArgs(notifyPayload(track)),{stdout:'ignore',stderr:'ignore'});
      }
    }
    if(pendingLyricsPath&&track.id){const path=pendingLyricsPath;pendingLyricsPath=undefined;void importLyrics(path,track.id);}
  }catch(e){
    status=e instanceof Error?e.message:String(e);track.playing=false;
  }finally{busy=false;}
}
let historyIndex=0,historyVersion=0,historyCover:Artwork|undefined;
let historyTrack:Track|undefined;
let historyQuery='';
async function browseHistory(delta=0){
  const version=++historyVersion;
  const entries=searchHistory(history.entries,historyQuery).length?searchHistory(history.entries,historyQuery):fuzzyMatch(history.entries,historyQuery);
  if(!entries.length){status=historyQuery?'No matching history':'Your listening history is empty';return;}
  historyIndex=(historyIndex+delta+entries.length)%entries.length;
  const entry=entries[historyIndex];
  historyTrack={...track,...entry,playing:false,position:0,duration:0};historyCover=undefined;
  ui.gallery={index:historyIndex,total:entries.length};
  const encoded=await history.cover(entry);
  if(encoded){try{const palette=await sharp(encoded).resize(32,32).removeAlpha().toColourspace('srgb').raw().toBuffer();if(version===historyVersion)historyCover={encoded,palette};}catch{status='Saved cover unavailable';}}
}
let notice='',noticeUntil=0;
function announce(message:string){notice=message;noticeUntil=Date.now()+6000;}
let focusInputMode=false,focusInput='25';
function openFocus(){focusInputMode=true;focusInput='25';ui.dialog={title:'Focus timer · minutes',input:focusInput,footer:'Enter start · 0 cancels timer · Escape close'};}
function setFocus(){focusInputMode=false;ui.dialog=undefined;try{const minutes=Number(focusInput);if(minutes===0){focus.cancel();announce('Focus timer cancelled');}else{focus.start(minutes);announce(`Focus started: ${minutes} minutes`);}}catch(e){announce(String(e));}}
let sleepInputMode=false,sleepInput='30';
function openSleep(){sleepInputMode=true;sleepInput='30';ui.dialog={title:'Sleep timer · minutes',input:sleepInput,footer:'Enter start · 0 cancels · Escape close'};}
let historySearchMode=false,historySearchInput='';
function openHistorySearch(){historySearchMode=true;historySearchInput=historyQuery;ui.dialog={title:'Search history',input:historySearchInput,footer:'Enter filter · empty shows all · Escape cancel'};}
function applyHistorySearch(){historySearchMode=false;historyQuery=historySearchInput;ui.dialog=undefined;void browseHistory();}
function setSleep(){sleepInputMode=false;ui.dialog=undefined;try{const minutes=parseIntStrict(sleepInput,0,180);if(minutes===undefined){announce('Choose 1–180 minutes');return;}if(minutes===0){sleep.cancel();announce('Sleep timer cancelled');}else{sleep.start(minutes);announce(`Sleep in ${minutes} minutes`);}}catch(e){announce(String(e));}}
let seekInputMode=false,seekInput='';
function openSeek(){seekInputMode=true;seekInput='';ui.dialog={title:'Seek · mm:ss or seconds',input:seekInput,footer:'Enter jump · Escape cancel'};}
function applySeek(){seekInputMode=false;ui.dialog=undefined;const position=parseDuration(seekInput);if(position===undefined){announce('Invalid time');return;}void backend.seek(position).then(()=>poll());}
let lyricsImportMode=false,lyricsPathInput='',lyricsImportTrack='';
function openLyricsImport(){lyricsImportMode=true;lyricsPathInput='';lyricsImportTrack=track.id;ui.dialog={title:'Import lyrics for '+track.name,input:'',footer:'Path to .lrc file · Enter import · Escape cancel'};}
async function importLyrics(path:string,id:string){
  try{const lines=await lyricsLibrary.import(id,path);if(track.id===id){lyricsVersion++;ui.lyricLines=shiftLyrics(lines,lyricsNudge);ui.lyricsOpen=true;}status='Lyrics imported';}catch(e){status=String(e);}
}
let captionMode=false,caption='';
let postcardSelection:{track:Track;artwork:Artwork}|undefined;
function openPostcard(){
  if(!cover){status='Album artwork is still loading';return;}
  postcardSelection={track:{...track},artwork:cover};captionMode=true;caption='';ui.dialog={title:'Create a listening postcard',input:'',footer:'Enter save · Escape cancel · caption optional'};
}
async function savePostcard(){
  captionMode=false;ui.dialog=undefined;
  if(!postcardSelection)return;
  const {track:snapshot,artwork:image}=postcardSelection;postcardSelection=undefined;status='Saving postcard…';
  try{const path=await exportPostcard(snapshot,image,caption);status=`Saved to postcards/${path.split('/').at(-1)}`;}catch(e){status=`Could not save postcard: ${String(e)}`;}
}
let queue=Promise.resolve();
const action=(c:Command)=>{
  if(!debounce.allow(c))return;
  if(!volumeLock.allow(c)){announce('Volume locked');return;}
  queue=queue.then(async()=>{
    if(closed)return;
    try{
      if(c==='next'){
        if(track.id)undoSkip.push(track.id);
        const queued=await consumePlayNext(queueList,item=>backend.playUri(item.id,item),()=>backend.command('next'));
        if(queued)announce(`Queue · ${queued.name}`);
        await poll();
        return;
      }
      if(c==='toggle'&&!track.playing&&pausedAt){
        const rewind=unpausePosition(track.position,Date.now()-pausedAt);
        if(rewind!==track.position)await backend.seek(rewind);
      }
      if(c==='pause'||(c==='toggle'&&track.playing))pausedAt=Date.now();
      await backend.command(c);await poll();
    }catch(e){status=e instanceof Error?e.message:String(e);}
  });
};
async function applyVolume(volume:number){
  await backend.setVolume(mute.apply(volume));
}
const overlay=new ArtworkOverlay(true,event=>{if(event.command==='quit')quit();else if(event.command==='mini')overlay.setMini(true);else if(event.command==='hide-mini')overlay.setMini(false);else if(event.command==='seek'){queue=queue.then(async()=>{try{await backend.seek(event.position);await poll();}catch(e){status=String(e);}});}else action(event.command);},{overlay:options.overlay,menuBar:options.menubar,systemMedia:options.systemMedia&&!options.demo});
renderer.setTerminalTitle(overlay.token);
const ui=new PlayerUI(renderer,action,overlay);
ui.fullscreen=options.fullscreen||saved.fullscreen||session.fullscreen;
ui.transitions=options.transitions||saved.transitions||session.transitions;
ui.lyricsOpen=session.lyricsOpen;
ui.compact=options.compact;
ui.night=night;
ui.highContrast=options.highContrast;
ui.mono=options.mono;
ui.onSeek=position=>{queue=queue.then(async()=>{try{await backend.seek(position);await poll();}catch(e){status=String(e);}});};
if(repeat!=='off')void backend.setRepeating(true).catch(()=>{});

function featureStatus(){
  const alert=Date.now()<noticeUntil?notice:status;
  if(alert)return alert;
  return composeStatus({
    demo:options.demo,
    overlay:overlay.note,
    focus:focus.remaining()!==undefined?`Focus ${String(Math.floor((focus.remaining()??0)/60)).padStart(2,'0')}:${String((focus.remaining()??0)%60).padStart(2,'0')}`:'',
    sleep:sleep.label(),
    pomodoro:pomodoro.label(),
    repeat,
    muted:mute.muted,
    vim,
    night:ui.night,
    shuffle:track.shuffle,
    favorite:favorites.has(track.id),
    rating:ratings.stars(track.id),
    loop:loop.active()?loop.label():'',
    session:stats.format(),
  })+` · ${volumeLabel(track.volume)} · ${wallClock()} · ${etaClock(track.position,track.duration)} ${playBadge(counts.count(track.id))} ${unicodeBar(track.duration?track.position/track.duration:0,8)}`;
}
function redraw(){
  if(closed)return;
  if(focus.expired())queue=queue.then(async()=>{try{await backend.command('pause');await poll();announce('Focus complete · playback paused');}catch(e){announce(`Focus complete; pause failed: ${String(e)}`);}});
  if(shouldAutoPause(ui.lastInteraction,track.playing))queue=queue.then(async()=>{try{await backend.command('pause');await poll();announce('Auto-paused after idle');}catch(e){announce(String(e));}});
  if(sleep.expired())queue=queue.then(async()=>{
    try{
      for(const step of fadeSteps(track.volume,0,1500)){await backend.setVolume(step.volume);if(step.wait)await Bun.sleep(step.wait);}
      await backend.command('pause');await poll();announce('Sleep · playback paused');
    }catch(e){announce(`Sleep pause failed: ${String(e)}`);}
  });
  const phase=pomodoro.phase;
  if(pomodoro.tick()!==phase&&pomodoro.phase!=='idle')announce(`Pomodoro ${pomodoro.phase}`);
  ui.focusRemaining=focus.remaining();
  ui.night=night;
  overlay.setTrack(track,cover);
  if(!options.demo)void history.record(track,cover).catch(()=>{status='Could not save listening history';});
  if(options.statusFile)void writeFile(statusFilePath(dataDirectory),formatStatusFile(track,windowTitle(track,overlay.token))).catch(()=>{});
  ui.draw(ui.gallery&&historyTrack?historyTrack:track,ui.gallery?historyCover:cover,options.demo,featureStatus());
}
const animation=setInterval(redraw,100);
const polling=setInterval(()=>void poll(),1000);
const ipcTick=setInterval(()=>void drainIpc(),500);
async function drainIpc(){
  const path=join(dataDirectory,'ipc');
  try{
    const text=await readFile(path,'utf8');
    await unlink(path);
    for(const line of text.split(/\r?\n/)){
      const cmd=parseIpc(line);
      if(!cmd)continue;
      if(cmd.action==='quit')return quit();
      if(cmd.action==='mute')return void toggleMute();
      if(cmd.action==='seek'&&typeof cmd.arg==='number')return void backend.seek(cmd.arg).then(()=>poll());
      if(cmd.action==='volume'&&typeof cmd.arg==='number')return void applyVolume(cmd.arg).then(()=>poll());
      if(cmd.action==='repeat'&&typeof cmd.arg==='string'){repeat=parseRepeatFlag(cmd.arg);void backend.setRepeating(repeat!=='off');return;}
      if(['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter'].includes(cmd.action))action(cmd.action as Command);
    }
  }catch{}
}
async function persistSession(){
  try{
    await restored.save({fullscreen:ui.fullscreen,transitions:ui.transitions,vim,repeat,volume:track.volume,lyricsOpen:ui.lyricsOpen});
    await configFile.save({...saved,vim,night,repeat,fullscreen:ui.fullscreen,transitions:ui.transitions,volume:track.volume});
  }catch{}
}
function quit(){closed=true;void persistSession();void lastTrack.save(track.id,track.position);overlay.close();clearInterval(animation);clearInterval(polling);clearInterval(ipcTick);renderer.destroy();process.exit(0);}
function requestQuit(){
  if(!quitGuard.press()){announce('Press Q again to quit');return;}
  quit();
}
async function toggleMute(){
  const next=mute.toggle(track.volume);
  await backend.setVolume(next.volume);
  announce(next.muted?'Muted':'Unmuted');
  await poll();
}
async function cycleRepeatMode(){
  repeat=cycleRepeat(repeat);
  await backend.setRepeating(repeat!=='off');
  announce(formatRepeatBadge(repeat)||'repeat off');
}
async function exportListening(){
  await mkdir(dataDirectory,{recursive:true});
  const rows=history.entries.map(e=>({id:e.id,name:e.name,artist:e.artist,album:e.album,playedAt:e.playedAt}));
  const csv=join(dataDirectory,'history.csv');
  const base=sanitizeFilename('history');
  await writeFile(csv,exportHistory(rows,'csv'));
  await writeFile(join(dataDirectory,`${base}.export.json`),exportHistory(rows,'json'));
  await writeFile(join(dataDirectory,`${base}.m3u`),exportHistory(rows,'m3u'));
  await writeFile(join(dataDirectory,'now.csv'),csvRow([track.id,track.name,track.artist]));
  announce(`Exported history.csv · ${rows.length} tracks`);
}
function showCheat(){
  ui.dialog={title:'Controls',lines:cheatSheetLines([...defaultCheatRows(),{key:'R',action:'repeat'},{key:'U',action:'mute'},{key:'?',action:'this sheet'}]),footer:'Escape close'};
}
function showWrapped(){
  const year=new Date().getUTCFullYear();
  const wrap=wrappedStats(history.entries,year);
  const streak=listeningStreak(history.entries.map(e=>e.playedAt));
  const heat=formatHeatmap(hourHeatmap(history.entries.map(e=>e.playedAt)));
  const week=weekStats(history.entries.map(e=>e.playedAt),isoWeek(new Date().toISOString()));
  const albums=albumProgress(history.entries).slice(0,3).map(a=>`${a.album} · ${a.tracks}`);
  ui.dialog={title:`Wrapped ${year}`,lines:[`${wrap.tracks} tracks · ${wrap.artists} artists`,`Top ${wrap.topArtist||'—'}`,`Track ${wrap.topTrack||'—'}`,`Streak ${streak.current}/${streak.longest}`,`Week ${week.plays} plays / ${week.days} days`,heat,...albums],footer:'Escape close'};
}
function showCharts(){
  const names=Object.fromEntries(history.entries.map(e=>[e.id,e.name]));
  const tracks=topTracks(counts.counts,names,8).map(t=>`${t.count}  ${t.name}`);
  const artists=topArtists(history.entries,counts.counts,8).map(a=>`${a.count}  ${a.artist}`);
  const groups=groupHistory(history.entries,'artist').slice(0,5).map(g=>`${g.key} (${g.items.length})`);
  const dups=findDuplicates(history.entries).slice(0,3).map(g=>`dup ${g[0].name}`);
  const shuffled=seededShuffle(history.entries.map(e=>e.name),1).slice(0,3);
  ui.dialog={title:'Charts',lines:[...tracks,'—',...artists,'—',...groups,...dups,...shuffled],footer:'Escape close'};
}
function showMeta(){
  const meta=formatTrackMeta(parseTrackMeta(track));
  const ref=parseSpotifyUri(track.spotifyUrl??track.id)??parseSpotifyUri(shareUrl(track.id));
  const uri=ref?formatSpotifyUri(ref):shareUrl(track.id);
  const url=ref?openSpotifyUrl(ref):shareUrl(track.id);
  const artists=splitArtists(track.artist).join(', ');
  const chip=formatHex(parseHex(hashColor(track.id))??[128,128,128]);
  const seen=track.id?firstSeen.get(track.id):undefined;
  const mood=cover?.palette?coverMood(cover.palette):'muted';
  const energy=cover?.palette?coverEnergy(cover.palette):0;
  ui.dialog={title:normalizeText(track.name),lines:wrapText([meta||'No extra metadata',artists,uri,url,youtubeSearchUrl(track),`mood ${mood} · energy ${energy.toFixed(2)} · ${cover?formatBytes(cover.encoded.length):''}`,seen?`first ${relativeTime(seen)}`:'',`fade ${crossfadeMs(400)}ms · seek ${seekRate(0)}s · ${chip} text ${readableText(chip)} · perc ${Math.round(linearToLogVolume(track.volume))}`,windowTitle(track,overlay.token),...trackIdenticon(track.id||'demo').split('\n')].filter(Boolean).join(' '),48),footer:'Escape close'};
}
function showQueue(){
  ui.dialog={title:'Play next',lines:queueList.items.map(i=>`${i.artist} — ${i.name}`),footer:queueList.items.length?'Escape close':'Queue empty · Escape close'};
}
let paletteOpen=false;
const palette=new CommandPalette([
  {id:'toggle',label:'Play / pause',run:()=>action('toggle')},
  {id:'next',label:'Next track',keywords:'skip',run:()=>action('next')},
  {id:'previous',label:'Previous track',keywords:'back',run:()=>action('previous')},
  {id:'louder',label:'Volume up',run:()=>action('louder')},
  {id:'quieter',label:'Volume down',run:()=>action('quieter')},
  {id:'shuffle',label:'Toggle shuffle',run:()=>action('shuffle')},
  {id:'repeat',label:'Cycle repeat mode',keywords:'loop',run:()=>void cycleRepeatMode()},
  {id:'mute',label:'Mute / unmute',run:()=>void toggleMute()},
  {id:'replay',label:'Replay from start',run:()=>void backend.seek(replayPosition()).then(()=>poll())},
  {id:'seek-time',label:'Seek to timestamp',keywords:'jump time',run:openSeek},
  {id:'mini',label:'Toggle desktop mini player',run:()=>overlay.setMini(!overlay.mini)},
  {id:'fullscreen',label:'Toggle fullscreen artwork',run:()=>ui.toggleFullscreen()},
  {id:'history',label:'Browse listening history',run:()=>browseHistory()},
  {id:'history-search',label:'Search listening history',run:openHistorySearch},
  {id:'postcard',label:'Create a listening postcard',keywords:'export image caption',run:openPostcard},
  {id:'transitions',label:'Toggle cover transitions',keywords:'animation fade',run:()=>{ui.transitions=!ui.transitions;}},
  {id:'overlay',label:'Enable native artwork overlay',keywords:'accessibility',run:()=>overlay.requestAccess()},
  {id:'lyrics',label:'Toggle synchronized lyrics',run:()=>{ui.lyricsOpen=!ui.lyricsOpen;}},
  {id:'import-lyrics',label:'Import lyrics from an LRC file',run:openLyricsImport},
  {id:'export-srt',label:'Export lyrics as SRT',run:async()=>{if(!ui.lyricLines.length){announce('No lyrics to export');return;}await mkdir(dataDirectory,{recursive:true});const path=join(dataDirectory,'lyrics.srt');await writeFile(path,lyricsToSrt(ui.lyricLines,track.duration));announce('Saved lyrics.srt');}},
  {id:'focus',label:'Start a focus timer',keywords:'pause session minutes',run:openFocus},
  {id:'cancel-focus',label:'Cancel focus timer',run:()=>{focus.cancel();announce('Focus timer cancelled');}},
  {id:'sleep',label:'Start a sleep timer',run:openSleep},
  {id:'pomodoro',label:'Start pomodoro',run:()=>{pomodoro.start();announce('Pomodoro work');}},
  {id:'cancel-pomodoro',label:'Cancel pomodoro',run:()=>{pomodoro.cancel();announce('Pomodoro cancelled');}},
  {id:'night',label:'Toggle night mode',run:()=>{night=!night;ui.night=night;announce(night?'Night on':'Night off');}},
  {id:'contrast',label:'Toggle high contrast',run:()=>{ui.highContrast=!ui.highContrast;announce(ui.highContrast?'High contrast':'Contrast default');}},
  {id:'mono',label:'Toggle monochrome theme',run:()=>{ui.mono=!ui.mono;announce(ui.mono?'Mono':'Color');}},
  {id:'vim',label:'Toggle vim keys',run:()=>{vim=!vim;announce(vim?'Vim keys':'Arrows');}},
  {id:'compact',label:'Toggle compact layout',run:()=>{ui.compact=!ui.compact;}},
  {id:'favorite',label:'Toggle favorite',run:()=>void favorites.toggle(track.id).then(on=>announce(on?'Favorited':'Unfavorited'))},
  {id:'block',label:'Block this track',run:()=>void blocked.add(track.id).then(()=>{announce('Blocked');action('next');})},
  {id:'bookmark',label:'Bookmark this moment',run:()=>void bookmarks.add(track.id,track.position).then(b=>announce(`Bookmark ${b.label}`))},
  {id:'bookmark-jump',label:'Jump to nearest bookmark',run:()=>{const b=bookmarks.nearest(track.id,track.position);if(!b){announce('No bookmarks');return;}void backend.seek(b.position).then(()=>poll());}},
  {id:'queue-add',label:'Add current track to play-next queue',run:()=>{queueList.enqueue({id:track.id,name:track.name,artist:track.artist});announce('Queued');}},
  {id:'queue',label:'Show play-next queue',run:showQueue},
  {id:'share',label:'Copy share text',keywords:'url',run:()=>announce(shareText(track))},
  {id:'export-history',label:'Export history CSV JSON M3U',run:()=>void exportListening()},
  {id:'charts',label:'Top tracks and artists',run:showCharts},
  {id:'wrapped',label:'Year in review',run:showWrapped},
  {id:'meta',label:'Track metadata and identicon',run:showMeta},
  {id:'cheatsheet',label:'Show keyboard cheat sheet',run:showCheat},
  {id:'rate-5',label:'Rate track 5 stars',run:()=>void ratings.rate(track.id,5).then(()=>announce(ratings.stars(track.id)))},
  {id:'volume-lock',label:'Lock volume',run:()=>announce(volumeLock.toggle()?'Volume locked':'Volume unlocked')},
  {id:'colorblind',label:'Toggle deuteranopia accent',run:()=>{ui.colorblind=!ui.colorblind;announce(ui.colorblind?'Colorblind accent':'Default accent');}},
  {id:'youtube',label:'YouTube search URL',run:()=>announce(youtubeSearchUrl(track))},
  {id:'bag-next',label:'Next from shuffle bag',run:()=>{bag.reset(history.entries);if(!history.entries.length){announce('Bag empty');return;}const item=bag.next();void backend.playUri(item.id,item).then(()=>poll());announce(`Bag · ${item.name}`);}},
  {id:'macro-fade',label:'Run quieter-quieter-pause macro',run:()=>{for(const step of expandMacros({fade:parseMacro('quieter quieter pause').join(' ')},'fade'))if(['quieter','pause'].includes(step))action(step as Command);}},
  {id:'import-m3u',label:'Import M3U from clipboard path',run:async()=>{try{const text=await readFile(join(dataDirectory,'history.m3u'),'utf8');for(const item of parseM3U(text))queueList.enqueue(item);announce(`Queued ${queueList.items.length}`);}catch{announce('No history.m3u');}}},
  {id:'undo-skip',label:'Undo last skip',run:()=>{const id=undoSkip.pop();if(!id){announce('Nothing to undo');return;}const entry=history.entries.find(e=>e.id===id);void backend.playUri(id,entry).then(()=>poll());announce(`Undo · ${entry?.name??id}`);}},
  {id:'quit',label:'Quit Spotterminal',run:requestQuit},
]);
function refreshPalette(){const view=palette.view(Math.max(1,Math.min(8,renderer.height-12)));ui.dialog={title:'Commands',input:palette.query,...view,footer:view.lines.length?'↑ ↓ choose · Enter run · Escape close':'No matching commands · Escape close'};}
function runMapped(name:string){
  if(name==='repeat')return void cycleRepeatMode();
  if(name==='mute')return void toggleMute();
  if(name==='replay')return void backend.seek(replayPosition()).then(()=>poll());
  if(['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter'].includes(name))action(name as Command);
}
renderer.keyInput.on('keypress',key=>{
  ui.interact();
  if(key.ctrl&&key.name==='c')return quit();
  const printable=!key.ctrl&&!key.meta&&key.sequence&&!/[\x00-\x1f\x7f]/.test(key.sequence);
  if(focusInputMode){
    if(key.name==='escape'){focusInputMode=false;ui.dialog=undefined;}
    else if(key.name==='return')setFocus();
    else if(key.name==='backspace')focusInput=focusInput.slice(0,-1);
    else if(printable&&/^[0-9.]+$/.test(key.sequence))focusInput=(focusInput+key.sequence).slice(0,8);
    if(ui.dialog)ui.dialog.input=focusInput;return;
  }
  if(sleepInputMode){
    if(key.name==='escape'){sleepInputMode=false;ui.dialog=undefined;}
    else if(key.name==='return')setSleep();
    else if(key.name==='backspace')sleepInput=sleepInput.slice(0,-1);
    else if(printable&&/^[0-9.]+$/.test(key.sequence))sleepInput=(sleepInput+key.sequence).slice(0,8);
    if(ui.dialog)ui.dialog.input=sleepInput;return;
  }
  if(seekInputMode){
    if(key.name==='escape'){seekInputMode=false;ui.dialog=undefined;}
    else if(key.name==='return')applySeek();
    else if(key.name==='backspace')seekInput=seekInput.slice(0,-1);
    else if(printable)seekInput=(seekInput+key.sequence).slice(0,12);
    if(ui.dialog)ui.dialog.input=seekInput;return;
  }
  if(historySearchMode){
    if(key.name==='escape'){historySearchMode=false;ui.dialog=undefined;}
    else if(key.name==='return')applyHistorySearch();
    else if(key.name==='backspace')historySearchInput=Array.from(historySearchInput).slice(0,-1).join('');
    else if(printable)historySearchInput=(historySearchInput+key.sequence).slice(0,80);
    if(ui.dialog)ui.dialog.input=historySearchInput;return;
  }
  if(lyricsImportMode){
    if(key.name==='escape'){lyricsImportMode=false;ui.dialog=undefined;}
    else if(key.name==='return'){lyricsImportMode=false;ui.dialog=undefined;void importLyrics(lyricsPathInput,lyricsImportTrack);}
    else if(key.name==='backspace')lyricsPathInput=Array.from(lyricsPathInput).slice(0,-1).join('');
    else if(printable)lyricsPathInput=(lyricsPathInput+key.sequence).slice(0,1000);
    if(ui.dialog)ui.dialog.input=lyricsPathInput;return;
  }
  if(captionMode){
    if(key.name==='escape'){captionMode=false;ui.dialog=undefined;}
    else if(key.name==='return')void savePostcard();
    else if(key.name==='backspace')caption=Array.from(caption).slice(0,-1).join('');
    else if(printable)caption=(caption+key.sequence).slice(0,160);
    if(ui.dialog)ui.dialog.input=caption;
    return;
  }
  if(paletteOpen){
    if(key.name==='escape'){paletteOpen=false;ui.dialog=undefined;return;}
    if(key.name==='return'){const selected=palette.choose();paletteHistory.push(palette.query);paletteOpen=false;ui.dialog=undefined;void selected?.run();return;}
    if(key.name==='up')palette.move(-1);
    else if(key.name==='down')palette.move(1);
    else if(key.name==='backspace')palette.edit(Array.from(palette.query).slice(0,-1).join(''));
    else if(printable)palette.edit((palette.query+key.sequence).slice(0,100));
    refreshPalette();return;
  }
  if(ui.dialog&&key.name==='escape'){ui.dialog=undefined;return;}
  if(ui.dialog)return;
  if(key.name==='/'||key.sequence==='/'){paletteOpen=true;palette.edit('');refreshPalette();return;}
  const mapped=keys.lookup(key.name)||keys.lookup(key.sequence);
  if(mapped){runMapped(mapped);return;}
  if(vim){
    const v=vimCommand(key.name)||(printable?vimCommand(key.sequence):undefined);
    if(v==='replay')return void backend.seek(replayPosition()).then(()=>poll());
    if(v)return action(v);
  }
  if(shouldReplay(key.name)||shouldReplay(key.sequence||''))return void backend.seek(replayPosition()).then(()=>poll());
  const jumped=jumpKey(key.name,track.duration)??(printable?jumpKey(key.sequence,track.duration):undefined);
  if(jumped!==undefined)return void backend.seek(jumped).then(()=>poll());
  if(key.sequence==='?'||key.name==='?'){showCheat();return;}
  if(key.name==='r')return void cycleRepeatMode();
  if(key.name==='u')return void toggleMute();
  if(key.name==='b')return void bookmarks.add(track.id,track.position).then(b=>announce(`Bookmark ${b.label}`));
  if(key.name==='a'){
    if(loop.a===undefined){loop.setA(track.position);announce(loop.label());}
    else if(loop.b===undefined){loop.setB(track.position);announce(loop.label());}
    else {loop.clear();announce('A-B cleared');}
    return;
  }
  if(key.name==='z'){openSleep();return;}
  if(key.name==='g')return void favorites.toggle(track.id).then(on=>announce(on?'Favorited':'Unfavorited'));
  if(key.name==='e')return void exportListening();
  if(key.name==='n'){night=!night;ui.night=night;announce(night?'Night on':'Night off');return;}
  if(key.name==='c'){ui.highContrast=!ui.highContrast;return;}
  if(key.name==='y'){announce(shareText(track));return;}
  if(key.name==='v'){vim=!vim;announce(vim?'Vim keys':'Arrows');return;}
  if(key.name==='w'){showWrapped();return;}
  if(key.name==='x')return void blocked.add(track.id).then(()=>{announce('Blocked');action('next');});
  if(key.name==='j'){if(pomodoro.phase==='idle')pomodoro.start();else pomodoro.cancel();announce(pomodoro.label()||'Pomodoro off');return;}
  if(key.name==='d'){showCharts();return;}
  if(key.name==='k'){showMeta();return;}
  if(key.sequence==='['||key.name==='['){const next=nudgeLyrics(ui.lyricLines,lyricsNudge,-0.1);if(next.changed){lyricsNudge=next.nudge;ui.lyricLines=next.lines;announce(`Lyrics ${lyricsNudge.toFixed(1)}s`);}return;}
  if(key.sequence===']'||key.name===']'){const next=nudgeLyrics(ui.lyricLines,lyricsNudge,0.1);if(next.changed){lyricsNudge=next.nudge;ui.lyricLines=next.lines;announce(`Lyrics ${lyricsNudge.toFixed(1)}s`);}return;}
  if(key.name==='m'){overlay.setMini(!overlay.mini);return;}
  if(key.name==='f'){openFocus();return;}
  if(key.name==='l'){ui.lyricsOpen=!ui.lyricsOpen;return;}
  if(key.name==='i'){openLyricsImport();return;}
  if(key.name==='p'){openPostcard();return;}
  if(key.name==='t'){ui.transitions=!ui.transitions;status=`Transitions ${ui.transitions?'on':'off'}`;return;}
  if(key.name==='h'){if(ui.gallery){ui.gallery=undefined;historyVersion++;}else void browseHistory();return;}
  if(ui.gallery&&(key.name==='left'||key.name==='right')){void browseHistory(key.name==='right'?1:-1);return;}
  if(ui.gallery&&key.name==='escape'){ui.gallery=undefined;historyVersion++;return;}
  if(key.name==='tab'){ui.toggleFullscreen();return;}
  if(key.sequence===';')return void backend.seek(skipBy(track.position,track.duration,-15)).then(()=>poll());
  if(key.sequence==="'")return void backend.seek(skipBy(track.position,track.duration,15)).then(()=>poll());
  if(key.name==='q')return requestQuit();
  if(key.name==='o'){overlay.requestAccess();return;}
  const transport:Record<string,Command>={space:'toggle',right:'next',left:'previous',up:'forward',down:'back',s:'shuffle','+':'louder','=':'louder','-':'quieter'};
  const c=transport[key.name]??transport[key.sequence];if(c)action(c);
});
process.on('SIGTERM',quit);process.on('SIGINT',quit);
ui.draw(track,cover,options.demo,status);
if(options.autoplay)action('play');else void poll();
