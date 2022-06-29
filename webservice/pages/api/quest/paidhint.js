import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "GET") {
    res.status(400).send({ message: "Only GET requests allowed" });
    return;
  }

  let quest_id = ""

  try {
    quest_id = req.body.quest_id;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing quest_id" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: `SELECT id, hint
              FROM paid_hints
              WHERE quest_id = $1
              LIMIT 1`,
      values: [quest_id]
    },
    (err, paidHints) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      if (paidHints.rowCount === 0) {
        res.status(200).json({
          result: [],
        });
        return
      }

      postgresPool.query(
        {
          text: `SELECT hint
                  FROM unlocked_hints
                  WHERE hint_id = $1 AND user_id = $2`,
          values: [result.rows[0].id, user_id]
        },
        (err, unlockedHints) => {
          if (err) {
            res.status(500).json({
              reason: "Data Not Found!"
            });
            return;
          }

          if (unlockedHints.rowCount > 0) {
            res.status(200).json({
              result: unlockedHints.rows,
            });
            return;
          }

          postgresPool.query(
            {
              text: `SELECT potions.id
                      FROM potions
                      LEFT JOIN potion_codes
                      ON potion_codes.id = potions.potion_id
                      WHERE potions.user_id = $1 AND potion_codes.code = "HINT-KEY"
                      LIMIT 1`,
              values: [user_id]
            },
            (err, potions) => {
              if (err) {
                res.status(500).json({
                  reason: "Data Not Found!"
                });
                return;
              }

              if (potions.rowCount === 0) {
                res.status(200).json({
                  result: [],
                });
                return;
              }

              postgresPool.query(
                {
                  text: `DELETE FROM potions
                          WHERE id = $1`,
                  values: [potions.rows[0].id]
                },
                (err, _) => {
                  if (err) {
                    res.status(500).json({
                      reason: "Data Not Found!"
                    });
                    return;
                  }

                  res.status(200).json({
                    result: unlockedHints.rows,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
}

export default check_jwt(handler)
