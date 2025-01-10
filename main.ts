import { Worker } from 'worker_threads';
import { LIMIT, MAX_WORKERS, SLEEP_TIME } from './config';


const runWorkers = async (): Promise<void> => {
    let currentOffset: number = 0;

    const increaseOffset = (offset: number) => {
        currentOffset = offset + LIMIT;
    }

    const sleepSpawnWorker = async (): Promise<void> => {
        if (currentOffset % (10 * LIMIT) === 0) {
            await Bun.sleep(SLEEP_TIME);
        }
    }

    const spawnWorker = (core: number): void => {
        const worker: Worker = new Worker("./worker.ts", {
            workerData: { 
                offset: currentOffset, 
                limit: LIMIT 
            } 
        });

        worker.on('message', async ({limit, offset, success, done}) => {
            if (success && !done) {
                await sleepSpawnWorker();
                spawnWorker(core);
                increaseOffset(currentOffset);
            }

            if (success && done) {
                console.log(`Copy done ! \n(limit: ${limit}, offset: ${offset})`);
            }
        });
    
        worker.on('error', (error) => {
            console.error(`Worker ${core} error:`, error);
        });
    
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker ${core} stopped with exit code ${code} ...`);
            }
        });
    }

    for (let core = 0; core < MAX_WORKERS; core++) {
        spawnWorker(core);
        increaseOffset(currentOffset);
    }
}

runWorkers().catch((error) => {
    console.error('Error running workers...', error);
});