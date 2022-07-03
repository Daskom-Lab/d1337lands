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
            achievement_codes.title, achievement_codes.description
      FROM achievements
      LEFT JOIN users
      ON achievements.user_id = users.id
      LEFT JOIN achievement_codes
      ON achievements.code_id = achievement_codes.id`, 
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
