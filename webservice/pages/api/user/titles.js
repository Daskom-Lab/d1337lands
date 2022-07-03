import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "GET") {
    res.status(400).send({ message: "Only GET requests allowed" });
    return;
  }

  postgresPool.query(
    `SELECT users.nickname, 
            title_codes.title, title_codes.description
      FROM titles
      LEFT JOIN users
      ON titles.user_id = users.id
      LEFT JOIN title_codes
      ON titles.code_id = title_codes.id`, 
    (err, result) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      res.status(200).json({
        result: result.rows,
      });
    }
  );
}

export default check_jwt(handler)
