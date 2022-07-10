const { Pool } = require("pg");

const connectionString = `postgresql://${process.env.POSTGRES_UNAME}:${process.env.POSTGRES_PASS}@postgres:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_UNAME}`;

export const postgresPool = new Pool({
  connectionString,
});