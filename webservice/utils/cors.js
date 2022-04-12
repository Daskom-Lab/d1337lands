import Cors from "cors";
import initMiddleware from "@/utils/init_middleware";

export const cors = initMiddleware(
  Cors({
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    origin: ["http://localhost:3333/", "http://localhost:4444", "http://localhost:5555", "http://localhost:6666"],
    maxAge: 600
  })
);