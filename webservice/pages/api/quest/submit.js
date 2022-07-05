import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  let answer = ""
  let quest_id = ""

  try {
    answer = req.body.answer;
    quest_id = req.body.quest_id;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing answer or quest_id" });
    return
  }

  if (!(answer.startsWith("https://") || answer.startsWith("http://"))) {
    res.status(400).send({ message: "Answer can only be in the form of a URL" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: `SELECT id
              FROM submissions
              WHERE quest_id = $1
              AND user_id = $2
              AND is_correct IS TRUE`,
      values: [quest_id, user_id]
    },
    (err, result) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      if (result.rowCount > 0) {
        res.status(200).json({
          result: "You have finished this quest already!",
        });
        return;
      }

      postgresPool.query(
        {
          text: `INSERT INTO submissions(answer, is_redeemed, quest_id, user_id)
              VALUES ($1, FALSE, $2, $3)`,
          values: [answer, quest_id, user_id]
        },
        (err, _) => {
          if (err) {
            res.status(500).json({
              reason: "Data Not Found!"
            });
            return;
          }

          res.status(200).json({
            result: "Submission is successfully created!",
          });
        }
      );
    }
  );
}

export default check_jwt(handler)
