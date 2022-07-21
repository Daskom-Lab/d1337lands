import Cors from "cors";
import initMiddleware from "@/utils/init_middleware";

export const cors = initMiddleware(
  Cors({
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    origin: process.env.MODE === "DEVELOPMENT" ? [
      "http://webservice:3000/",
      "http://discordbot:3000",
      "http://websocket:3000",
      "http://game:3000",
      `http://${process.env.HOST}:${process.env.WEBSERVICE_PORT}`,
      `http://${process.env.HOST}:${process.env.DISCORDBOT_PORT}`,
      `http://${process.env.HOST}:${process.env.WEBSOCKET_PORT}`,
      `http://${process.env.HOST}:${process.env.GAME_PORT}`
    ] : [
      "http://webservice:3000/",
      "http://discordbot:3000",
      "http://websocket:3000",
      "http://game:3000",
      `https://${process.env.HOST}`
    ],
    maxAge: 600
  })
);