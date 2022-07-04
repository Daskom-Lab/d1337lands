import { postgresPool } from "@/utils/postgres";
import { cors } from "@/utils/cors";
import check_jwt from "@/utils/jwt";

async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "GET") {
    res.status(400).send({ message: "Only GET requests allowed" });
    return;
  }

  let category = ""

  try {
    category = req.body.category;
  } catch (error) {
    res.status(400).send({ message: "Payload is missing category" });
    return
  }

  postgresPool.query(
    {
      text: `SELECT id, title, description, level, reward, created_at 
              FROM quests
              WHERE category = $1`,
      values: [category]
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
