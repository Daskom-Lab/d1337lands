const { Pool } = require("pg");

const connectionString = "postgresql://postgres:M98vDBjHerkB44eYTM3t3sJSYfj2Vw@localhost:5432/postgres";

export const postgresPool = new Pool({
  connectionString,
});