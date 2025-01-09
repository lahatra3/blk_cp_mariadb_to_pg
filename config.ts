import type { PoolConfig as PostgresPoolConfig } from "pg";
import type { PoolConfig as MariadbPoolConfig } from 'mariadb';

export const mariadbConfig: MariadbPoolConfig = {
    host: '172.17.0.1',
    port: 3307,
    user: 'mariadb',
    password: 'm_41*d3',
    database: 'ldf'
};
  
export const postgresConfig: PostgresPoolConfig = {
    host: '172.17.0.1',
    port: 5431,
    user: 'postgres',
    password: 'p0s_gr3s',
    database: 'ldf'
};

export const DATA_SOURCE_TABLE = Bun.env['DATA_SOURCE_TABLE'];
export const DATA_SINK_TABLE = Bun.env['DATA_SINK_TABLE'];