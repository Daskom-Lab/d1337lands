from functools import lru_cache
import eventlet
import socketio
import requests
import glob
import json

from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

sio = socketio.Server(cors_allowed_origins=[
    "http://localhost:4444", "http://localhost:7777", "http://localhost:3000"
])
app = socketio.WSGIApp(sio)

auth_validation_url = "http://localhost:4444/api/authentication/validate"
graphql_endpoint_url = "http://localhost:3333/v1/graphql"
hasura_admin_secret = "hSK6kPeZN2zTLsvd2grPNtapLbeNzD9QU9aPd38f894JsmxM7Ecpb9hkAxeX"

def getMapData(map_name):
    collisions = []
    with open(f"assets/{map_name}/collision.json", "r") as f:
        collisions = json.loads(f.read())["data"]

    map_size = {}
    with open(f"assets/{map_name}/map.json", "r") as f:
        map_data = json.loads(f.read())
        map_size = {
            "width": map_data["width"],
            "height": map_data["height"]
        }

    return {
        "collisions": collisions,
        "map_size": map_size
    }

maps = [x.replace("assets/", "") for x in glob.glob("assets/*")]

maps_data = {}
for map in maps:
    maps_data[map] = getMapData(map)

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
    next_position = None
    if (direction == "up" and position > maps_data[map_name]["map_size"]["width"]):
        next_position = position - maps_data[map_name]["map_size"]["width"]
    if (direction == "left" and position % maps_data[map_name]["map_size"]["width"] != 1):
        next_position = position - 1
    if (direction == "down" and position < maps_data[map_name]["map_size"]["width"] * (maps_data[map_name]["map_size"]["height"] - 1)):
        next_position = position + maps_data[map_name]["map_size"]["height"]
    if (direction == "right" and position % maps_data[map_name]["map_size"]["width"] != 0):
        next_position = position + 1

    if (next_position and not maps_data[map_name]["collisions"][next_position]):
        return next_position
    else:
        return position

@sio.event
def connect(sid, _, auth):
    req = requests.post(auth_validation_url, headers={"Authorization": f"Bearer {auth['token']}"})
    if (req.status_code == 401):
        return "ERR", 401

    if (req.status_code != 200):
        return "ERR", req.status_code

    user_data = json.loads(req.text)
    user_id = user_data["id"]
    user_name = user_data["name"]
    user_role = user_data["role"]
    user_nickname = user_data["nickname"]

    sio.save_session(sid, {
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "user_nickname": user_nickname
    })

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

    query = gql(r"""
        query getUserData ($userId: bigint!) {
            user_datas(where: {user_id: {_eq: $userId}}) {
                map
                position
            }
        }
    """)

    result = client.execute(query, variable_values={
        "userId": user_id
    })

    sio.enter_room(sid, user_id)
    print(f"User connected: {sid}")

    sio.emit("user_data", {
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "user_nickname": user_nickname,
        "user_datas": result["user_datas"]
    }, room=user_id)

    return "OK", 200

@sio.event
def disconnect(sid):
    session = sio.get_session(sid)
    sio.leave_room(sid, session["user_id"])
    print(f"User disconnected: {sid}")
    return "OK", 200

@sio.event
def send_action(sid, data):
    session = sio.get_session(sid)

    data_to_emit = {}
    if (data["action"] == "initialize_data"):
        try:
            transport = RequestsHTTPTransport(
                url=graphql_endpoint_url,
                verify=True,
                retries=3,
                headers={
                    "content-type": "application/json",
                    "x-hasura-admin-secret": hasura_admin_secret
                },
            )
            client = Client(transport=transport, fetch_schema_from_transport=True) 

            query = gql(r"""
                mutation insertUserData($userId: bigint!, $map: String!, $position: String!) {
                    insert_user_datas_one(object: {map: $map, position: $position, user_id: $userId}) {
                        id
                    }
                } 
            """)

            _ = client.execute(query, variable_values={
                "userId": session["user_id"],
                "map": "town",
                "position": "0,0"
            })
        except:
            return "ERR", 500

        data_to_emit["action"] =  {
            "action": data["action"],
            "map": "town",
            "position": "0,0"
        }

        data_to_emit["map"] = {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            "map": "town",
            "position": "0,0"
        }

    if (data_to_emit["action"]):
        sio.emit("handle_action", data_to_emit["action"], room=session["user_id"], skip_sid=sid)

    if (data_to_emit["map"]):
        sio.emit("map_state", data_to_emit["map"], room=data_to_emit["map"]["map"], skip_sid=sid)

    return "OK", 200

@sio.event
def enter_map(sid, data):
    sio.enter_room(sid, data["map"])
    return "OK", 200

@sio.event
def leave_map(sid, data):
    sio.leave_room(sid, data["map"])
    return "OK", 200

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 5000)), app)