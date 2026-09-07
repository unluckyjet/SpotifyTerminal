export class UndoStack<T> {
  private items:T[]=[];
  push(item:T){this.items.push(item);}
  pop(){return this.items.pop();}
  get length(){return this.items.length;}
}
