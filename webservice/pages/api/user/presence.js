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
    `SELECT user_datas.user_id, user_datas.position, user_datas.map, user_datas.is_online, 
            users.nickname, users.role, users.character, users.chosen_title
      FROM users
      LEFT JOIN user_datas
      ON user_datas.user_id = users.id`, 
    (err, result) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!, reason: " + err
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
