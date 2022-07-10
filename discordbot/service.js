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

  app.get("/", async (_, response) => {
    response.status(200).json({
      "result": "Service is running properly!"
    })
  });

  // Get a user role based on given user_id
  app.get("/getUserData/:user_id", async (request, response) => {
    const guild = await client.guilds.fetch(process.env.DISCORDBOT_GUILD_ID);
    guild.members.fetch(request.params.user_id)
      .then((res) => {
        let roles = res.roles.member["_roles"];
        let role_names = [];
        for (let i = 0; i < roles.length; i++) {
          role_names.push(res.roles.resolve(roles[i]).name)
        }

        response.status(200).json({
          "roles": role_names,
          "username": res.user.username
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
client.login(process.env.DISCORDBOT_CLIENT_TOKEN);
