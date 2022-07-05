import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  let submission_id = ""

  try {
    submission_id = req.body.submission_id;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing submission_id" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: `SELECT submissions.id, submissions.answer, submissions.is_correct, submissions.is_redeemed,
                    quests.reward
              FROM submissions
              LEFT JOIN quests
              ON quests.id = submissions.quest_id
              WHERE submissions.id = $1`,
      values: [submission_id]
    },
    (err, submission) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      if (submission.rows[0].is_redeemed) {
        res.status(200).json({
          reason: "You have redeemed this submission before!"
        });
        return;
      }

      if (submission.rows[0].is_correct === undefined ||
        submission.rows[0].is_correct === null) {
        res.status(200).json({
          result: "You cant redeem this submission yet, please (kindly) ask the mentor to check it first!",
        });
        return;
      }

      if (submission.rows[0].is_correct) {
        postgresPool.query(
          {
            text: `UPDATE users
                    SET leetcoin = leetcoin + $1
                    WHERE id = $2`,
            values: [submission.rows[0].reward, user_id]
          },
          (err, _) => {
            if (err) {
              res.status(500).json({
                reason: "Data Not Found!"
              });
              return;
            }
          }
        );
      }

      postgresPool.query(
        {
          text: `UPDATE submissions
                  SET is_redeemed = TRUE
                  WHERE id = $1`,
          values: [submission_id]
        },
        (err, _) => {
          if (err) {
            res.status(500).json({
              reason: "Data Not Found!"
            });
            return;
          }

          res.status(200).json({
            result: "You successfully redeemed this submission!",
          });
        }
      );
    }
  );
}

export default check_jwt(handler)
