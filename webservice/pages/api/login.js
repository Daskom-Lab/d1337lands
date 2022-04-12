const axios = require("axios").default;
const roles_name = ["higher"];

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

  const user_id = req.body.username;

  axios
    .get(`http://localhost:5555/getUserRole/${user_id}`)
    .then((result) => {
      res.status(200).json({
        role: isExistInArr(roles_name, result.data.roles) ? "Mentor" : "Player",
      });
    })
    .catch((error) => {
      console.log(error.response.data);
      res.status(400).json(error.response.data);
    });
}
