import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "GET") {
    res.status(400).send({ message: "Only GET requests allowed" });
    return;
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: `SELECT submissions.id, submissions.answer, submissions.is_correct, 
                    quests.title, quests.category, quests.level
              FROM submissions
              LEFT JOIN quests
              ON quests.id = submissions.quest_id
              WHERE NOT submissions.is_redeemed
              AND submissions.user_id = $1`,
      values: [user_id]
    },
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
