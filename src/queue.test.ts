import {test,expect} from 'bun:test';
import {PlayQueue,consumePlayNext,type QueueItem} from './queue';
import {Demo} from './spotify';
const t=(id:string):QueueItem=>({id,name:id,artist:id});
test('PlayQueue enqueue appends, playNext unshifts, dequeue shifts, move splices, clear empties',()=>{
  const q=new PlayQueue();
  expect(q.items).toEqual([]);expect(q.peek()).toBeUndefined();expect(q.dequeue()).toBeUndefined();
  q.enqueue(t('a'));q.enqueue(t('b'));expect(q.items.map(i=>i.id)).toEqual(['a','b']);expect(q.peek()?.id).toBe('a');
  q.playNext(t('n'));expect(q.items.map(i=>i.id)).toEqual(['n','a','b']);
  expect(q.dequeue()?.id).toBe('n');expect(q.items.map(i=>i.id)).toEqual(['a','b']);expect(q.peek()?.id).toBe('a');
  q.enqueue(t('c'));expect(q.items.map(i=>i.id)).toEqual(['a','b','c']);
  q.move(2,0);expect(q.items.map(i=>i.id)).toEqual(['c','a','b']);
  q.move(0,2);expect(q.items.map(i=>i.id)).toEqual(['a','b','c']);
  q.move(1,1);expect(q.items.map(i=>i.id)).toEqual(['a','b','c']);
  const snap=q.items.map(i=>i.id);
  for(const [from,to] of [[-1,0],[0,-1],[3,0],[0,3],[99,1],[1,99],[0.5,1],[1,1.5],[NaN,0],[0,NaN],[Infinity,0],[0,Infinity]] as const)
    q.move(from,to);
  expect(q.items.map(i=>i.id)).toEqual(snap);
  q.clear();expect(q.items).toEqual([]);expect(q.peek()).toBeUndefined();expect(q.dequeue()).toBeUndefined();
  q.move(0,0);expect(q.items).toEqual([]);
  q.playNext(t('z'));q.enqueue(t('y'));expect(q.dequeue()?.id).toBe('z');expect(q.dequeue()?.id).toBe('y');expect(q.dequeue()).toBeUndefined();
});
test('consumePlayNext plays the dequeued item instead of skipping',async()=>{
  const q=new PlayQueue();
  const d=new Demo();
  const skip=async()=>{await d.command('next');};
  q.enqueue({id:'queued-1',name:'Queued Song',artist:'Queue Artist'});
  const played=await consumePlayNext(q,item=>d.playUri(item.id,item),skip);
  expect(played?.name).toBe('Queued Song');
  const track=await d.read();
  expect(track.name).toBe('Queued Song');
  expect(track.artist).toBe('Queue Artist');
  expect(track.id).toBe('queued-1');
  expect(q.items).toHaveLength(0);
  const skipped=await consumePlayNext(q,item=>d.playUri(item.id,item),skip);
  expect(skipped).toBeUndefined();
  expect((await d.read()).name).toBe('Go To Town');
});
