import initMiddleware from "@/utils/init_middleware";
const Jwt = require("express-jwt");
const jsonwebtoken = require("jsonwebtoken");

export const jwt = initMiddleware(
  Jwt({ 
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    requestProperty: "decoded_jwt"
  }).unless({
    path: [
      "/api/authentication/login"
    ]
  })
);

export function jwt_sign(data) {
  return jsonwebtoken.sign(data, process.env.JWT_SECRET);
}

export default function check_jwt(handler) {
  return async (req, res) => {
    try {
      await jwt(req, res)
      await handler(req, res)

    } catch (err) {
      if (err.name === 'UnauthorizedError')
        res.status(401).json({
          reason: "User token is invalid"
        });
    }
  }
}