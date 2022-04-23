import initMiddleware from "@/utils/init_middleware";
const Jwt = require("express-jwt");
const jsonwebtoken = require("jsonwebtoken");

export const jwt = initMiddleware(
  Jwt({ 
    secret: "9NE5uLKVMB5Pm3YNHXxKFBYyDCRP6FzFrY8CxmNFckQ6fJQKTvm5SHPCUE7Rma3WQpSzYh",
    algorithms: ["HS256"],
    requestProperty: "decoded_jwt"
  }).unless({
    path: [
      "/api/authentication/login"
    ]
  })
);

export function jwt_sign(data) {
  return jsonwebtoken.sign(data, "9NE5uLKVMB5Pm3YNHXxKFBYyDCRP6FzFrY8CxmNFckQ6fJQKTvm5SHPCUE7Rma3WQpSzYh");
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