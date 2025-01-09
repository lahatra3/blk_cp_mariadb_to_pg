import { parentPort, workerData } from 'worker_threads';
import { Readable, Transform } from 'stream';
import { createPool } from 'mariadb';
import { Pool } from 'pg';
import { from } from 'pg-copy-streams';
import { mariadbConfig, postgresConfig, DATA_SOURCE_TABLE, DATA_SINK_TABLE } from 'config';
import { rowToCsvData } from 'utils';

const mariadbPool = createPool(mariadbConfig);
const postgresPool = new Pool(postgresConfig);

const copyData = async (limit: number, offset: number): Promise<void> => {
    const mariadbConn = await mariadbPool.getConnection();
    const postgresConn = await postgresPool.connect();

    const READ_QUERY = `${DATA_SOURCE_TABLE} LIMIT ${limit} OFFSET ${offset}`;
    const WRITE_QUERY = `COPY ${DATA_SINK_TABLE} FROM STDIN WITH CSV QUOTE '"' DELIMITER ','`;

    try {
        const inputStream: Readable = mariadbConn.queryStream({
            sql: READ_QUERY,
            bulk: true,
            timezone: 'Z'
        });

        const transformStream: Transform = new Transform({
            objectMode: true,
            transform(data, encoding, callback) {
                const csvData = rowToCsvData(data);
                callback(null, csvData);
            }
        });

        const outputStream = postgresConn.query(from(WRITE_QUERY));        

        await new Promise<void>((resolve, reject) => {
            inputStream
                .pipe(transformStream)
                .pipe(outputStream)
                .on('finish', resolve)
                .on('error', reject);
        });
        parentPort?.postMessage({ offset, limit, success: true, done: false });
    } catch(error) {
        console.error('Error during data copy:', error);
        parentPort?.postMessage({ offset, limit, success: false, error });
    } finally {
        mariadbConn.release();
        postgresConn.release();
    }
}

copyData(workerData.offset, workerData.limit).finally(() => {
    mariadbPool.end();
    postgresPool.end();
});