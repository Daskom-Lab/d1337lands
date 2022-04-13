import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);
  
  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }

  const jwt_claims = req.decoded_jwt["https://hasura.io/jwt/claims"]
  const name = jwt_claims["x-hasura-user-name"]
  const role = jwt_claims["x-hasura-default-role"]

  res.status(200).json({
    "name": name,
    "role": role
  })
}

export default check_jwt(handler)
