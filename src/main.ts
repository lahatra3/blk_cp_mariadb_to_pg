import { CopyData } from "./processor";
import { LIMIT, MAX_WORKERS, SLEEP_TIME } from "./config";

(() => {
    const copyData = new CopyData(LIMIT, SLEEP_TIME, MAX_WORKERS);

    console.log('Start processing data...');
    copyData.run().catch((error) => {
        console.error('Error running workers...', error);
    });
})();