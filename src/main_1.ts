import { Readable, Transform } from 'stream';
import { createPool } from 'mariadb';
import { Pool } from 'pg';
import { from } from 'pg-copy-streams';
import { mariadbConfig, postgresConfig } from 'config';

const mariadbPool = createPool(mariadbConfig);
const postgresPool = new Pool(postgresConfig);

const copyData = async (): Promise<void> => {
    const mariadbConn = await mariadbPool.getConnection();
    const postgresConn = await postgresPool.connect();

    try {
        const inputStream: Readable = mariadbConn.queryStream({
            sql: `SELECT * FROM prm_cdr_rated limit 10 offset 0`,
            bulk: true,
            timezone: 'Z'
        });

        inputStream.once('data', (data) => {
            inputStream.pause()
        });
        inputStream.once('end', () => {
            console.log("Vita");
        });
        
        const transformStream = new Transform({
            objectMode: true,
            transform(row, encoding, callback) {
                const csvRow = Object.values(row)
                    .map((value) => {
                        if (value instanceof Date) {
                            return value.toISOString();
                        }

                        if (typeof value === 'string' && /GMT/i.test(value)) {
                            return value.replace(/GMT([+-]\d{4})/, (_, offset) => {
                                return `${offset.slice(0, 3)}:${offset.slice(3)}`;
                            });
                        }

                        return value && `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(',') + '\n';
                callback(null, csvRow);
            }
        });

        const outputStream = postgresConn.query(
            from(`COPY prm_cdr_rated FROM STDIN WITH CSV QUOTE '"' DELIMITER ','`)
        );

        await new Promise<void>((resolve, reject) => {
            inputStream
            .pipe(transformStream)
            .pipe(outputStream)
            .on('finish', resolve)
            .on('error', reject);

        });
        
        console.log('Data copy completed successfully.');
    } catch(error) {
        console.error('Error during data copy:', error);
    } finally {
        mariadbConn.release();
        postgresConn.release();
    }
};

copyData().finally(() => {
    mariadbPool.end();
    postgresPool.end();
});