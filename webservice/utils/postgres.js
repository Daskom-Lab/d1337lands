const { Pool } = require("pg");

const connectionString = `postgresql://${process.env.POSTGRES_UNAME}:${process.env.POSTGRES_PASS}@database:5432/${process.env.POSTGRES_UNAME}`;

export const postgresPool = new Pool({
  connectionString,
});