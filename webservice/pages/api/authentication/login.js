import bcrypt_hash, { bcrypt_compare } from "@/utils/bcrypt";
import { cors } from "@/utils/cors";
import { jwt_sign } from "@/utils/jwt";
import { postgresPool } from "@/utils/postgres";
import { isMentorRoleExist } from "@/utils/roles";

const axios = require("axios").default;

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }
 
  let userId = ""
  let password = ""

  try {
    userId = req.body.username;
    password = req.body.password; 
  } catch (error) {
    res.status(400).send({ message: "Payload is missing username and password" });
    return
  }

  postgresPool.query("SELECT value FROM role", (err, queryResRoles) => {
    if (err) {
      res.status(403).json({
        reason: "Login Failed!"
      });
      return;
    }

    axios.get(`http://localhost:5555/getUserData/${userId}`).then((userData) => {
      let availableRoles = {};
      queryResRoles.rows.map((data) => {
        availableRoles[data.value] = data.value;
      });

      const userRole = isMentorRoleExist(userData.data.roles) ? availableRoles.mentor : availableRoles.player;
      const readQuery = {
        text: "SELECT id, username, password, role, nickname FROM users WHERE username = $1 LIMIT 1",
        values: [userId],
      };

      postgresPool.query(readQuery, (err, queryResUsers) => {
        if (err) {
          res.status(403).json({
            reason: "Login Failed!"
          });
          return;
        }

        // User registration using their discord user_id
        if(queryResUsers.rows.length === 0) {
          if(password !== `daskom1337_${userId}`) {
            res.status(403).json({
              reason: "Login Failed!"
            });
            return;
          } 

          try {
            const insertQuery = {
              text: "INSERT INTO users(username, password, role, character, nickname, leetcoin) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
              values: [userId, bcrypt_hash(password), userRole, "basic", userData.data.username, 1000],
            };

            postgresPool.query(insertQuery, (err, result) => {
              if (err) {
                console.log(err)
                res.status(403).json({
                  reason: "Login Failed!",
                });
                return;
              }

              const JWT_DATA = {
                "https://hasura.io/jwt/claims": {
                    "x-hasura-allowed-roles": [userRole],
                    "x-hasura-default-role": userRole,
                    "x-hasura-user-name": userId,
                    "x-hasura-user-id": result.rows[0].id,
                    "x-hasura-user-nickname": userData.data.username,
                }
              };

              res.status(200).json({
                accessToken: jwt_sign(JWT_DATA),
              });
            });
          } catch (err) {
            res.status(403).json({
              reason: "Login Failed!"
            });
            return;
          }

        // User login using their username and password
        } else {
          if (!bcrypt_compare(password, queryResUsers.rows[0].password)) {
            res.status(403).json({
              reason: "Login Failed!"
            });
            return;
          }

          const JWT_DATA = {
            "https://hasura.io/jwt/claims": {
                "x-hasura-allowed-roles": [userRole],
                "x-hasura-default-role": userRole,
                "x-hasura-user-name": queryResUsers.rows[0].username,
                "x-hasura-user-id": queryResUsers.rows[0].id,
                "x-hasura-user-nickname": queryResUsers.rows[0].nickname,
            }
          };

          res.status(200).json({
            accessToken: jwt_sign(JWT_DATA),
          });
          return;
        }
      });
    }).catch((error) => {
      res.status(403).json(error.response.data);
      return;
    });
  });  
}
