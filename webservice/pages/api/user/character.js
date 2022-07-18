import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";
import get_character_url, { upload_character_image } from "@/utils/imagekit";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  let character_image = ""

  try {
    character_image = req.body.character_image;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing character_image" });
    return
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const user_id = jwt_claims["x-hasura-user-id"]

  upload_character_image(
    character_image, user_id, (is_success, data) => {
      if (!is_success) {
        res.status(500).json({
          reason: "Data Not Found!, reason: " + data
        });
        return
      }

      postgresPool.query(
        {
          text: `UPDATE users
                  SET character = $1
                  WHERE id = $2`,
          values: [get_character_url(user_id), user_id]
        },
        (err, _) => {
          if (err) {
            res.status(500).json({
              reason: "Data Not Found!, reason: " + err
            });
            return;
          }

          res.status(200).json({
            result: "Player character image have been changed successfully!",
          });
        }
      );
    }
  )
}

export default check_jwt(handler)
