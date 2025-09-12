# SmartRecu Backend

## Overview

WebSocket + Express backend that ingests ESP32 sensor data (humidity, CO2, inside/outside temperature) and stores them in PostgreSQL. It also periodically aggregates 5‑minute analytics buckets.

## Runtime Schema Auto‑Init

On startup the server ensures the following tables exist (see `src/database.ts`):

Tables:

- humidity(id SERIAL, humidity REAL 0..100, timestamp TIMESTAMPTZ default now())
- co2(id SERIAL, co2 INTEGER >=0, timestamp TIMESTAMPTZ default now())
- temp_inside(id SERIAL, temp_inside REAL, timestamp TIMESTAMPTZ default now())
- temp_outside(id SERIAL, temp_outside REAL, timestamp TIMESTAMPTZ default now())
- sensor_analytics(bucket_start TIMESTAMPTZ PRIMARY KEY, avg_humidity REAL, avg_co2 REAL, avg_temp_inside REAL, avg_temp_outside REAL, samples INT, updated_at TIMESTAMPTZ)

Indexes on timestamp columns accelerate latest queries.

## Data Flow

1. ESP32 sends `update` messages over WebSocket containing current readings.
2. Values are cached in memory.
3. Every 2 minutes (`SENSOR_PERSIST_MS`) cached values are inserted if both humidity and CO2 are present.
4. Every 5 minutes (`ANALYTICS_REFRESH_MS`) an aggregation job upserts a 5‑minute bucket into `sensor_analytics`.
5. Web clients requesting history receive last N humidity & CO2 rows (see `getLatestSensorData`).

## Environment Variables

- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- DB_SSL (default true), DB_SSL_REJECT_UNAUTHORIZED (default false)
- PORT (default 3000)

## Development

Install dependencies and run in dev mode:

```
yarn install
yarn dev
```

Compile & run production build:

```
yarn build
yarn start
```

## Future Improvements

- Introduce formal migrations (e.g. node-pg-migrate or drizzle) instead of ad-hoc init.
- Paginated & parameterized history endpoint via HTTP.
- Retention policy / downsampling strategy.
- Tests for aggregation (currently minimal).

## Minimal Test Idea

Add jest or vitest to assert schema init & simple insert/select. (Not yet implemented to keep footprint light.)
