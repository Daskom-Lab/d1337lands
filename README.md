<div align="center">
██████╗░░█████╗░░██████╗██╗░░██╗░█████╗░███╗░░░███╗  
██╔══██╗██╔══██╗██╔════╝██║░██╔╝██╔══██╗████╗░████║  
██║░░██║███████║╚█████╗░█████═╝░██║░░██║██╔████╔██║  
██║░░██║██╔══██║░╚═══██╗██╔═██╗░██║░░██║██║╚██╔╝██║  
██████╔╝██║░░██║██████╔╝██║░╚██╗╚█████╔╝██║░╚═╝░██║  
╚═════╝░╚═╝░░╚═╝╚═════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░░░░╚═╝
</div>
<div align="center">  
        ░░███╗░░██████╗░██████╗░███████╗  
</div>
<div align="center">  
        ░████║░░╚════██╗╚════██╗╚════██║   
</div>
<div align="center">  
        ██╔██║░░░█████╔╝░█████╔╝░░░░██╔╝ 
</div> 
<div align="center">  
        ╚═╝██║░░░╚═══██╗░╚═══██╗░░░██╔╝░  
</div> 
<div align="center">  
        ███████╗██████╔╝██████╔╝░░██╔╝░░  
</div> 
<div align="center">  
        ╚══════╝╚═════╝░╚═════╝░░░╚═╝░░░  
</div>
</br>
This project is basically daskom1337 community first ever website (and project) that aims to create a place to expose our identity to the internet and to also gather around internally to learn and play together (because we also made a game, how cool is that right?).

## Project Structure

This is the project structure including a brief explanation of each directory.

```
d1337lands
├── database    [place where the database migrations stays]
├── discordbot  [our own discord bot customized for games and other stuff]
├── game        [the game!!! (its an rpg game btw)]
├── webservice  [frontend and serverless api for the web stuff]
├── websocket   [connectors for between the game and the web frontend via socketio] 
└── README.md   [this is where you are now]
```

## How to run

### Prerequisites

Remember that you have to have these apps first in order to run the codebase :

1. Hasura CLI  

2. Docker & Docker Compose

3. Yarn

### Steps

These are the steps you can follow to run the codebase without having to know all the technical details behind it (consider this as a high level overview of how to run it) :

1. Setup the environment  
    ```env
    cat > .env <<EOF
    WEBSERVICE_PORT=4444
    WEBSOCKET_PORT=6666
    GAME_PORT=7777

    GQL_PORT=3333
    GQL_SECRET=whatever_secret_you_want_to_give

    POSTGRES_PORT=5432
    POSTGRES_UNAME=postgres
    POSTGRES_PASS=whatever_secret_you_want_to_give

    JWT_SECRET=whatever_secret_you_want_to_give

    DISCORDBOT_PORT=5555
    DISCORDBOT_GUILD_ID=your_discord_server_id
    DISCORDBOT_CLIENT_TOKEN=your_discordbot_client_token

    HASURA_GRAPHQL_ENDPOINT=3333
    HASURA_GRAPHQL_ADMIN_SECRET=whatever_secret_you_want_to_give
    EOF
    ```

    > **Note:**  
        - **You have to change all the secrets (including pass) with something secret, ofc**  
        - **All env variables starting with `HASURA_` have to match the ones starting with `GQL_`**

2. Run the codebase
    ```shell
    make serve && make migrate
    ```

## Contributing

All kinds of contributions are very much welcome! Please dont hesitate to contact us via anyone of our community member if you want to talk/ask about something, or if you are a current/former daskom laboratory assistant and want to join us, go ahead and contact us as the door will always be open for you!

If you want to contribute to this project specifically, you can read the guide in [CONTRIBUTING.md](./CONTRIBUTING.md), please also note that for development contribution, you have to see the **development** section in that file

## License

```
Copyright (C) 2022  Daskom1337 Community

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
