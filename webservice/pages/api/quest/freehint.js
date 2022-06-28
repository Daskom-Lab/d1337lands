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

  postgresPool.query(
    {
      text: `SELECT hint
              FROM free_hints
              WHERE quest_id = $1 
              LIMIT 1`,
      values: [quest_id]
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
