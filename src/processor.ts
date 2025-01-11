import { Worker } from 'worker_threads';
import { resolve } from 'path';

export class CopyData {
   private _currentOffset: number = 0;
   private _activeTask: number = 0;
   private _limit!: number;
   private _sleepTime!: number;
   private _concurrency!: number;
   
   constructor(limit: number, sleepTime: number, concurrency: number) {
      this._limit = limit;
      this._sleepTime = sleepTime;
      this._concurrency = concurrency;
      this._activeTask = concurrency;
   }

   public get currentOffset(): number {
      return this._currentOffset;
   }

   public set currentOffset(offset: number) {
      this._currentOffset = offset;
   }

   public get limit(): number {
      return this._limit;
   }
   
   public get sleepTime(): number {
      return this._sleepTime;
   }

   public get concurrency(): number {
      return this._concurrency;
   }

   public get activeTask(): number {
      return this._activeTask;
   }

   public set activeTask(taskCount: number) {
      this._activeTask = taskCount;
   }

   private updateCurrentOffset(offset: number): void {
      this.currentOffset = offset + this.limit;
   }

   private async timeoutSpawn(): Promise<void> {
      const isTime = this.currentOffset % (10 * this.limit) === 0;
      if (isTime) {
         await Bun.sleep(this.sleepTime);
      }
   }

   private spawn(core: number): void {        
      const worker: Worker = new Worker(resolve(__dirname, 'task.ts'), {
         workerData: { 
               offset: this.currentOffset,
               limit: this.limit
         }
      });

      worker.on('message', async ({limit, offset, success, done}) => {
         if (success) {
               if (done) {
                  this.activeTask -= 1;
               } else {
                  await this.timeoutSpawn();
                  this.spawn(core);
                  this.updateCurrentOffset(this.currentOffset);
               }
         }
      });
   
      worker.on('error', (error) => {
         console.error(`Worker ${core} error:`, error);
      });
   
      worker.on('exit', (code) => {
         if (code !== 0) {
               console.error(`Worker ${core} stopped with exit code ${code} ...`);
         }

         if (this.activeTask === 0) {
               console.log('Copy done !');
         }
      });
   }

   public async run(): Promise<void> {
      for (let i = 0; i < this.concurrency; i++) {
         this.spawn(i);
         this.updateCurrentOffset(this.currentOffset);
      }
   }
}