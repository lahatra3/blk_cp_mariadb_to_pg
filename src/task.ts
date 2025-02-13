import { parentPort, workerData } from 'worker_threads';
import { Readable, Transform } from 'stream';
import { createPool } from 'mariadb';
import { Pool } from 'pg';
import { from } from 'pg-copy-streams';
import { rowToCsvData } from './utils';
import { DATA_SINK_TABLE, DATA_SOURCE_TABLE, MARIADB_CONF, POSTGRES_CONF } from './config';

const mariadbPool = createPool(MARIADB_CONF);
const postgresPool = new Pool(POSTGRES_CONF);

const copyProcessing = async (limit: number, offset: number): Promise<void> => {    
    const mariadbConn = await mariadbPool.getConnection();
    const postgresConn = await postgresPool.connect();    

    const READ_QUERY = `${DATA_SOURCE_TABLE} LIMIT ${limit} OFFSET ${offset}`;
    const WRITE_QUERY = `COPY ${DATA_SINK_TABLE} FROM STDIN WITH CSV QUOTE '"' DELIMITER ','`;

    let done = true;

    try {
        const inputStream: Readable = mariadbConn.queryStream({
            sql: READ_QUERY,
            bulk: true,
            timezone: 'Z'
        });

        inputStream.on('data', (chunk) => done = false);

        const transformStream: Transform = new Transform({
            objectMode: true,
            transform(data, encoding, callback) {
                const csvData = rowToCsvData(data);
                callback(null, csvData);
            }
        });

        const outputStream = postgresConn.query(from(WRITE_QUERY));

        return await new Promise<void>((resolve, reject) => {
            inputStream
                .pipe(transformStream)
                .pipe(outputStream)
                .on('finish', () => {
                    parentPort?.postMessage({ offset, limit, success: true, done });
                    resolve();
                })
                .on('error', reject);
        });

    } catch(error) {
        console.error('Error during data copy...', error);
        parentPort?.postMessage({ offset, limit, success: false, error });
    } finally {
        mariadbConn.release();
        postgresConn.release();
    }
}

copyProcessing(workerData.limit, workerData.offset).finally(() => {
    mariadbPool.end();
    postgresPool.end();
});
