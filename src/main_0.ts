import { createPool, type PoolOptions } from 'mysql2';
import { Client, type PoolConfig } from 'pg';
import * as pgCopyStream from 'pg-copy-streams';
import { Readable, Transform } from 'stream';

const mariadbConfig: PoolOptions = {
    host: '172.17.0.1',
    port: 3307,
    user: 'mariadb',
    password: 'm_41*d3',
    database: 'ldf'
};
  
const postgresConfig: PoolConfig = {
    host: '172.17.0.1',
    port: 5431,
    user: 'postgres',
    password: 'p0s_gr3s',
    database: 'ldf'
};

const migrateData = async () => {
    const mariadb = createPool(mariadbConfig);
    const postgres = new Client(postgresConfig);

    try {
        const queryStream: Readable = mariadb.query(`SELECT * FROM prm_cdr_rated`)
            .stream({ highWaterMark: 1024 * 1024 * 512 });

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

                        return value === null ? '\\N' : `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(',') + '\n';
                callback(null, csvRow);
            }
        });

        await postgres.connect();

        const copyStream = postgres.query(
            pgCopyStream.from(`COPY prm_cdr_rated FROM STDIN WITH CSV QUOTE '"' DELIMITER ','`)
        );

        queryStream
            .pipe(transformStream)
            .pipe(copyStream)
            .on('finish', () => {
                console.log('Data migration completed successfully.');
                mariadb.end();
                postgres.end();
            })
            .on('error', (error) => {
                console.error('Error during data migration:', error);
                mariadb.end();
                postgres.end();
            });

    } catch (error) {
        console.error('Error during data migration:', error);
        mariadb.end();
        postgres.end();
    }
}

migrateData();