import Cors from "cors";
import initMiddleware from "@/utils/init-middleware";

var whitelist = ["http://localhost:5432/", "http://localhost:8080/", "http://localhost:3002/", "http://localhost:5000/"];

export const cors = initMiddleware(
  Cors({
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    origin: function (origin, callback) {
      console.log(origin);
      if (whitelist.indexOf(origin) !== -1) callback(null, true);
      else callback(null, false);
    },
  })
);
