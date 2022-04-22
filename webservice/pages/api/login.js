const axios = require("axios").default;
const { Pool, Client } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connectionString = "postgresql://postgres:M98vDBjHerkB44eYTM3t3sJSYfj2Vw@localhost:5432/postgres";
var valueRole;
var mentorRoles = ["Community Contributor", "Community Mentor"];
var availableRoles = {};

function isExistInArr(array_1, array_2) {
  for (let i = 0; i < array_1.length; i++) 
    if (array_2.includes(array_1[i])) return true;
  return false;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(400).send({ message: "Only POST requests allowed" });
    return;
  }
  const userId = req.body.username;
  const password = req.body.password; 
  const pool = new Pool({
    connectionString,
  });
  pool.query(`SELECT value FROM role`, (err, queryRes) => {
    if (!err) {
      valueRole = queryRes.rows;
      valueRole.map(function (obj) {
        availableRoles[obj.value] = obj.value;
      });
      axios
      .get(`http://localhost:5555/getUserRole/${userId}`)
      .then((result) => {
        const readQuery = {
          text: 'SELECT id, username, password, role, nickname FROM users WHERE username = $1 LIMIT 1',
          values: [userId],
        }
        pool.query(readQuery, (err, queryResUsers) => {
          if (!err) {
            if(queryResUsers.rows.length === 0) {
              if(password !== `daskom1337_${userId}`) {
                res.status(403).json({message: "Login Failed!"});
                return;
              } else {
                  try {
                    const role = isExistInArr(mentorRoles, result.data.roles) ? availableRoles["Mentor"] : availableRoles["Player"];
                    bcrypt.genSalt(10, function (err, salt) {
                      bcrypt.hash(password, salt, function (err, hashPassword) {
                        const query = {
                          text: 'INSERT INTO users(username, password, role, character, nickname) VALUES($1, $2, $3, $4, $5)',
                          values: [userId, hashPassword, role, "Human", "Alex"],
                        }
                        pool.query(query, (err, result) => {
                          if (!err) { 
                           const JWT_DATA = {
                              "https://hasura.io/jwt/claims": {
                                  "x-hasura-allowed-roles": [role],
                                  "x-hasura-default-role": role,
                                  "x-hasura-user-name": userId,
                                  "x-hasura-user-id": '' + result.rows[0].id,
                                  "x-hasura-user-nickname": "Alex",
                              }
                            }
                            const accessToken = jwt.sign(JWT_DATA, "9NE5uLKVMB5Pm3YNHXxKFBYyDCRP6FzFrY8CxmNFckQ6fJQKTvm5SHPCUE7Rma3WQpSzYh");
                            res.status(200).json({
                              accessToken: accessToken,
                            });
                            console.log("Login Success!");
                            return;
                          }
                          else 
                            console.log(err.message);
                            res.status(403).json({
                              reason: "Login Failed!",
                            });
                            return;
                        });
                      });
                    });

                  } catch(err) {
                    console.log(err.response.data);
                  }
              }
              
            } else {
                bcrypt.compare(password, queryResUsers.rows[0].password, function (err, isEqual) {
                  if(isEqual){
                    const role = isExistInArr(mentorRoles, result.data.roles) ? availableRoles["Mentor"] : availableRoles["Player"];
                    const JWT_DATA = {
                      "https://hasura.io/jwt/claims": {
                          "x-hasura-allowed-roles": [role],
                          "x-hasura-default-role": role,
                          "x-hasura-user-name": queryResUsers.rows[0].username,
                          "x-hasura-user-id": '' + queryResUsers.rows[0].id,
                          "x-hasura-user-nickname": queryResUsers.rows[0].nickname,
                      }
                    }
                    const accessToken = jwt.sign(JWT_DATA, "9NE5uLKVMB5Pm3YNHXxKFBYyDCRP6FzFrY8CxmNFckQ6fJQKTvm5SHPCUE7Rma3WQpSzYh")
                    res.status(200).json({
                      accessToken: accessToken,
                      message: "Login Success!"
                    });
                    return;
                  } else {
                    res.status(403).json({message: "Login Failed!"});
                    return
                  }
              }); 
            }
          } else {
            console.log(err);
            res.status(403).json({reason: "Login Failed!"});
          } 
        })

      })
      .catch((error) => {
        console.log(error);
        res.status(400).json(error.response.data);
        return;
      });
    }
    else {
      console.log(err);
      res.status(403).json({reason: "Login Failed!"});
      return;
    }
  });  
}
