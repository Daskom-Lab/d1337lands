const { Pool } = require("pg");

// TODO: BUILD THE ENV SYSTEM NOWWWW !!!!!
const connectionString = "postgresql://postgres:M98vDBjHerkB44eYTM3t3sJSYfj2Vw@postgres:5432/postgres";

export const postgresPool = new Pool({
  connectionString,
});