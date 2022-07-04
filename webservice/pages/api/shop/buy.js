import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  let potion_id = ""

  try {
    potion_id = req.body.potion_id;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing potion_id" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: `SELECT leetcoin
              FROM users
              WHERE id = $1`,
      values: [user_id]
    },
    (err, user) => {
      if (err) {
        res.status(500).json({
          reason: "Data Not Found!"
        });
        return;
      }

      postgresPool.query(
        {
          text: `SELECT price
                  FROM potion_codes
                  WHERE id = $1`,
          values: [potion_id]
        },
        (err, potion) => {
          if (err) {
            res.status(500).json({
              reason: "Data Not Found!"
            });
            return;
          }

          if (user.rows[0].leetcoin >= potion.rows[0].price) {
            postgresPool.query(
              {
                text: `UPDATE users
                        SET leetcoin = $1
                        WHERE id = $2`,
                values: [user.rows[0].leetcoin - potion.rows[0].price, user_id]
              },
              (err, _) => {
                if (err) {
                  res.status(500).json({
                    reason: "Data Not Found!"
                  });
                  return;
                }

                postgresPool.query(
                  {
                    text: `INSERT INTO potions(potion_id, user_id, is_active)
                            VALUES ($1, $2, FALSE)`,
                    values: [potion_id, user_id]
                  },
                  (err, _) => {
                    if (err) {
                      res.status(500).json({
                        reason: "Data Not Found!"
                      });
                      return;
                    }

                    res.status(200).json({
                      result: "You successfully purchased this potion!",
                    });
                  }
                );
              }
            );
          } else {
            res.status(200).json({
              result: "Your leetcoin is not enough to buy this potion!"
            });
            return;
          }
        }
      );
    }
  );
}

export default check_jwt(handler)
