const { Client, Intents } = require("discord.js");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once("ready", () => {

  app.get("/", async (request, response) => {
    response.status(200).json({
      "result": "Service is running properly!"
    })
  });

  // Get a user role based on given user_id
  app.get("/getUserRole/:user_id", async (request, response) => {
    const guild = await client.guilds.fetch("962874739649548378");
    guild.members.fetch(request.params.user_id)
      .then((res) => {
        let roles = res.roles.member["_roles"];
        let role_names = [];
        for (let i = 0; i < roles.length; i++) {
          role_names.push(res.roles.resolve(roles[i]).name)
        }

        response.status(200).json({
          "roles": role_names
        })
      })
      .catch((err) => {
        console.log(err)
        response.status(500).json({
          "reason": "User could not be found (you may have given wrong user_id)"
        })
      });
  });

  app.listen(port, () => {
    console.log(`Discord bot service is listening on port ${port}`)
  });

});

// Login to Discord with your clients token
client.login("OTYyODU1MDk3MDk0Nzk5NDAw.YlNmsA.KimxBAdCPm7Bdp2yd4o1Rf3i87I");
