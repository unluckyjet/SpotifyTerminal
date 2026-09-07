export async function readWithRetry<T>(read:()=>Promise<T>,budget:RetryBudget,wait:(ms:number)=>Promise<void>=(ms)=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<T>{
  for(;;){
    try{
      const value=await read();
      budget.ok();
      return value;
    }catch(error){
      const attempt=budget.attempts;
      if(budget.fail())throw error;
      await wait(backoffDelay(attempt));
    }
  }
}
export function backoffDelay(attempt:number,base=200,cap=5000){
  const n=Number.isFinite(attempt)?Math.max(0,attempt):0;
  const b=Number.isFinite(base)?Math.max(0,base):200;
  const c=Number.isFinite(cap)?Math.max(0,cap):5000;
  return Math.min(c,b*2**n);
}
export class RetryBudget {
  #max:number;
  #attempts=0;
  constructor(max=5){this.#max=Number.isFinite(max)&&max>=0?Math.floor(max):5;}
  fail(){
    this.#attempts++;
    return this.#attempts>=this.#max;
  }
  ok(){this.#attempts=0;}
  get attempts(){return this.#attempts;}
}
