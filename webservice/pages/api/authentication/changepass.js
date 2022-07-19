import bcrypt_hash, { bcrypt_compare } from "@/utils/bcrypt";
import { cors } from "@/utils/cors";
import { jwt_sign } from "@/utils/jwt";
import { postgresPool } from "@/utils/postgres";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  let cur_password = ""
  let new_password = ""

  try {
    cur_password = req.body.cur_password;
    new_password = req.body.new_password;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing cur_password or new_password" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  postgresPool.query(
    {
      text: "SELECT id, password FROM users WHERE id = $1 LIMIT 1",
      values: [user_id],
    },
    (err, queryResUsers) => {
      if (err) {
        res.status(403).json({
          reason: "Change password failed!"
        });
        return;
      }

      if (queryResUsers.rowCount === 0) {
        res.status(403).json({
          reason: "User not found!"
        });
        return;
      }

      if (!bcrypt_compare(cur_password, queryResUsers.rows[0].password)) {
        res.status(403).json({
          reason: "Current password is not correct!"
        });
        return;
      }

      postgresPool.query(
        {
          text: "UPDATE users SET password = $1 WHERE id = $2",
          values: [bcrypt_hash(new_password), user_id],
        },
        (err, _) => {
          if (err) {
            res.status(403).json({
              reason: "Change password failed!"
            });
            return;
          }

          res.status(200).json({
            result: "Password changed successfully!",
          });
          return;
        }
      );
    }
  );
}

export default check_jwt(handler)