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
  let is_correct = false

  try {
    submission_id = req.body.submission_id;
    is_correct = req.body.is_correct;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing submission_id or is_correct" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_role = jwt_claims["x-hasura-default-role"]

  if (user_role !== "mentor") {
    res.status(200).json({
      reason: "You are not allowed to check all submissions!"
    });
    return;
  }

  postgresPool.query(
    {
      text: `UPDATE submissions
              SET is_correct = $1
              WHERE id = submission_id`,
      values: [is_correct, submission_id]
    },
    (err, result) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      res.status(200).json({
        result: "You successfully made the correction on this submission!",
      });
    }
  );
}

export default check_jwt(handler)
