from functools import lru_cache
import eventlet
import socketio
import requests
import random
import json

from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

from subservices.chatService import ChatNamespace

game_url = "http://localhost:8080"
auth_validation_url = "http://localhost:4444/api/authentication/validate"
graphql_endpoint_url = "http://localhost:3333/v1/graphql"
hasura_admin_secret = "hSK6kPeZN2zTLsvd2grPNtapLbeNzD9QU9aPd38f894JsmxM7Ecpb9hkAxeX"


def getMapData(map_name):
    collisions = []
    with requests.get(f"{game_url}/assets/maps/{map_name}/collision.json") as r:
        collisions = [pos for pos, x in enumerate(json.loads(r.text)["data"]) if x > 0]

    startpositions = []
    with requests.get(f"{game_url}/assets/maps/{map_name}/startpositions.json") as r:
        startpositions = [
            pos for pos, x in enumerate(json.loads(r.text)["data"]) if x > 0
        ]

    map_size = {}
    with requests.get(f"{game_url}/assets/maps/{map_name}/map.json") as r:
        map_data = json.loads(r.text)
        map_size = {"width": int(map_data["width"]), "height": int(map_data["height"])}

    return {
        "startpositions": startpositions,
        "collisions": collisions,
        "map_size": map_size,
    }


maps = ["town"]

maps_data = {}
for map in maps:
    maps_data[map] = getMapData(map)

sio = socketio.Server(
    cors_allowed_origins=[
        "http://localhost:4444",
        "http://localhost:7777",
        "http://localhost:3000",
        "http://localhost:8080",
    ]
)
app = socketio.WSGIApp(sio)


def getRandomStartPosition(map_name):
    return random.choice(maps_data[map_name]["startpositions"])


@lru_cache
def getNextPosition(map_name, position, direction):
    """
    Check if character can move to next position or not
    and get the next position if they can

    Note:
        * position should be 1-indexed number for the
        specific calculation implemented here
        * collision here will be considered as boolean
        value with either 0 (false) or more than 0 (true)
    """
    position = int(position)

    next_position = None
    if direction == "up" and position > maps_data[map_name]["map_size"]["width"]:
        next_position = position - maps_data[map_name]["map_size"]["width"]
    if direction == "left" and position % maps_data[map_name]["map_size"]["width"] != 1:
        next_position = position - 1
    if direction == "down" and position < (
        maps_data[map_name]["map_size"]["width"]
        * maps_data[map_name]["map_size"]["height"]
    ) - (maps_data[map_name]["map_size"]["width"] - 1):
        next_position = position + maps_data[map_name]["map_size"]["width"]
    if (
        direction == "right"
        and position % maps_data[map_name]["map_size"]["width"] != 0
    ):
        next_position = position + 1

    if next_position and next_position not in maps_data[map_name]["collisions"]:
        return next_position
    else:
        return position


@sio.event
def connect(sid, _, auth):
    # TODO: we have to fingerprint if this connections is coming from the game or the ui
    #       so that the remaining data save will only occur on either of one side but not both
    req = requests.post(
        auth_validation_url, headers={"Authorization": f"Bearer {auth['token']}"}
    )
    if req.status_code == 401:
        return "ERR", 401

    if req.status_code != 200:
        return "ERR", req.status_code

    user_data = json.loads(req.text)
    user_id = user_data["id"]
    user_name = user_data["name"]
    user_role = user_data["role"]
    user_nickname = user_data["nickname"]

    user_session = {
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "user_nickname": user_nickname,
    }

    sio.save_session(sid, user_session)

    transport = RequestsHTTPTransport(
        url=graphql_endpoint_url,
        verify=True,
        retries=3,
        headers={
            "content-type": "application/json",
            "Authorization": "Bearer {}".format(auth["token"]),
        },
    )
    client = Client(transport=transport, fetch_schema_from_transport=True)

    try:
        query = gql(
            r"""
            query getUserData ($userId: bigint!) {
                user_datas(where: {user_id: {_eq: $userId}}) {
                    map
                    position
                }
            }
        """
        )

        result = client.execute(query, variable_values={"userId": user_id})

        if len(result["user_datas"]) != 0:
            user_session["user_datas"] = result["user_datas"][0]
            sio.save_session(sid, user_session)
    except:
        pass

    sio.enter_room(sid, user_id)
    print(f"User connected: {sid}")

    sio.emit(
        "user_data",
        {
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "user_nickname": user_nickname,
            "user_datas": result["user_datas"][0] if len(result["user_datas"]) > 0 else [],
        },
        room=user_id,
    )

    return "OK", 200


@sio.event
def disconnect(sid):
    session = sio.get_session(sid)

    transport = RequestsHTTPTransport(
        url=graphql_endpoint_url,
        verify=True,
        retries=3,
        headers={
            "content-type": "application/json",
            "x-hasura-admin-secret": hasura_admin_secret,
        },
    )
    client = Client(transport=transport, fetch_schema_from_transport=True)

    query = gql(
        r"""
        mutation updateUserData($userId: bigint!, $map: String!, $position: String!) {
            update_user_datas(where: {user_id: {_eq: $userId}}, _set: {map: $map, position: $position}) {
                affected_rows
            }
        }
    """
    )

    _ = client.execute(
        query,
        variable_values={
            "userId": session["user_id"],
            "map": session["user_datas"]["map"],
            "position": f"{session['user_datas']['position']}",
        },
    )

    data_to_emit = {
        "map": {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            "map": session["user_datas"]["map"],
            "position": "-1",
        }
    }

    sio.emit(
        "map_state",
        data_to_emit["map"],
        room=data_to_emit["map"]["map"],
        skip_sid=sid,
    )

    sio.leave_room(sid, session["user_id"])
    print(f"User disconnected: {sid}")
    return "OK", 200


@sio.event
def send_action(sid, data):
    session = sio.get_session(sid)

    data_to_emit = {}
    if data["action"] == "initialize_data":
        initial_user_datas = {
            "map": "town",
            "position": f"{getRandomStartPosition('town')}",
        }

        try:
            transport = RequestsHTTPTransport(
                url=graphql_endpoint_url,
                verify=True,
                retries=3,
                headers={
                    "content-type": "application/json",
                    "x-hasura-admin-secret": hasura_admin_secret,
                },
            )
            client = Client(transport=transport, fetch_schema_from_transport=True)

            query = gql(
                r"""
                mutation insertUserData($userId: bigint!, $map: String!, $position: String!) {
                    insert_user_datas_one(object: {map: $map, position: $position, user_id: $userId}) {
                        id
                    }
                }
            """
            )

            _ = client.execute(
                query,
                variable_values={"userId": session["user_id"], **initial_user_datas},
            )
        except:
            return "ERR", 500

        data_to_emit["action"] = {"action": data["action"], **initial_user_datas}

        data_to_emit["map"] = {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            **initial_user_datas,
        }

        session["user_datas"] = initial_user_datas
        sio.save_session(sid, session)

    elif data["action"] == "move":
        next_position = getNextPosition(
            session["user_datas"]["map"],
            session["user_datas"]["position"],
            data["direction"],
        )

        new_user_datas = {
            "map": session["user_datas"]["map"],
            "position": next_position,
        }

        data_to_emit["action"] = {
            "action": data["action"],
            "direction": data["direction"],
            **new_user_datas,
        }

        data_to_emit["map"] = {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            **new_user_datas,
        }

        session["user_datas"] = new_user_datas
        sio.save_session(sid, session)

    if data_to_emit["action"]:
        sio.emit(
            "handle_action",
            data_to_emit["action"],
            room=session["user_id"],
            skip_sid=sid,
        )

    if data_to_emit["map"]:
        sio.emit(
            "map_state",
            data_to_emit["map"],
            room=data_to_emit["map"]["map"],
            skip_sid=sid,
        )

    return "OK", 200


@sio.event
def enter_map(sid, data):
    sio.enter_room(sid, data["map"])
    return "OK", 200


@sio.event
def leave_map(sid, data):
    sio.leave_room(sid, data["map"])
    return "OK", 200

sio.register_namespace(ChatNamespace('/chat'))


if __name__ == "__main__":
    eventlet.wsgi.server(eventlet.listen(("", 5000)), app)
