export type QueueItem={id:string;name:string;artist:string};
export async function consumePlayNext(
  queue:PlayQueue,
  playUri:(item:QueueItem)=>Promise<unknown>,
  skip:()=>Promise<unknown>,
){
  const item=queue.dequeue();
  if(item){await playUri(item);return item;}
  await skip();
  return undefined;
}
export class PlayQueue {
  items:QueueItem[]=[];
  enqueue(item:QueueItem){this.items.push(item);}
  playNext(item:QueueItem){this.items.unshift(item);}
  dequeue(){return this.items.shift();}
  peek(){return this.items[0];}
  clear(){this.items.length=0;}
  move(from:number,to:number){
    const n=this.items.length;
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=n||to>=n)return;
    const [item]=this.items.splice(from,1);
    this.items.splice(to,0,item);
  }
}
