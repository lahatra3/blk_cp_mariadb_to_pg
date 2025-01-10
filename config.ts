import { availableParallelism } from 'os';
import type { PoolConfig as PostgresPoolConfig } from 'pg';
import type { PoolConfig as MariadbPoolConfig } from 'mariadb';

export const MARIADB_CONF: MariadbPoolConfig = {
    host: Bun.env['MARIADB_HOST'],
    port: +Bun.env['MARIADB_PORT']!,
    user: Bun.env['MARIADB_USER'],
    password: Bun.env['MARIADB_PASSWORD'],
    database: Bun.env['MARIADB_DBNAME']
};
  
export const POSTGRES_CONF: PostgresPoolConfig = {
    host: Bun.env['PG_HOST'],
    port: +Bun.env['PG_PORT']!,
    user: Bun.env['PG_USER'],
    password: Bun.env['PG_PASSWORD'],
    database: Bun.env['PG_DBNAME']
};

export const DATA_SOURCE_TABLE = Bun.env['MARIADB_TABLE'];
export const DATA_SINK_TABLE = Bun.env['PG_TABLE'];

export const MAX_WORKERS = +Bun.env['MAX_WORKERS']! || availableParallelism();
export const LIMIT = +Bun.env['BATCH_SIZE']! || 10;
export const SLEEP_TIME: number = 131;
