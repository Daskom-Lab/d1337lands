import eventlet
import socketio
import requests
import json

from subservices.chatService import ChatNamespace
from util.game import Game
from util.query import call_request

auth_validation_url = "http://localhost:4444/api/authentication/validate"
users_presence_url = "http://localhost:3000/api/user/presence"

sio = socketio.Server(
    cors_allowed_origins=[
        "http://localhost:4444",
        "http://localhost:7777",
        "http://localhost:3000",
        "http://localhost:8080",
    ]
)
app = socketio.WSGIApp(sio)
game = Game()


def isFromWeb(connection_source):
    return connection_source == "web"


@sio.event
def connect(sid, _, auth):
    req = requests.post(
        auth_validation_url, headers={"Authorization": f"Bearer {auth['token']}"}
    )
    if req.status_code == 401:
        return "ERR: Authorization error", 401

    if req.status_code != 200:
        return "ERR: Unknown error", req.status_code

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
        "connection_source": auth["connection_source"],
    }

    sio.save_session(sid, user_session)

    result = {"user_datas": []}

    try:
        result = call_request(
            r"""
                query getUserData ($userId: bigint!) {
                    user_datas(where: {user_id: {_eq: $userId}}) {
                        map
                        position
                    }
                }
            """,
            {"userId": user_id},
            auth["token"],
        )

        if len(result["user_datas"]) > 0:
            user_session["user_datas"] = result["user_datas"][0]
            sio.save_session(sid, user_session)
    except:
        pass

    sio.enter_room(sid, user_id)

    if len(result["user_datas"]) > 0:
        sio.enter_room(sid, result["user_datas"][0]["map"])

    print(f"User connected to game socket: {sid}\n\n")

    if isFromWeb(auth["connection_source"]):
        _ = call_request(
            r"""
                mutation updateUserData($userId: bigint!, $is_online: Boolean!) {
                    update_user_datas(where: {user_id: {_eq: $userId}}, _set: {is_online: $is_online}) {
                        affected_rows
                    }
                }
            """,
            {
                "userId": user_id,
                "is_online": True,
            },
            auth["token"],
        )

        sio.emit(
            "user_connect",
            {
                "user_id": user_id,
                "user_nickname": user_nickname,
                "user_role": user_role,
                "user_datas": result["user_datas"][0]
                if len(result["user_datas"]) > 0
                else {},
            },
        )

        with requests.get(
            users_presence_url, headers={"Authorization": f"Bearer {auth['token']}"}
        ) as r:
            for user in json.loads(r.text)["result"]:
                if user["is_online"] and user["user_id"] != user_id:
                    sio.emit(
                        "user_connect",
                        {
                            "user_id": user["user_id"],
                            "user_nickname": user["nickname"],
                            "user_role": user["role"],
                            "user_datas": {
                                "map": user["map"],
                                "position": user["position"],
                            },
                        },
                        room=user_id,
                    )

    sio.emit(
        "user_data",
        {
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "user_nickname": user_nickname,
            "user_datas": result["user_datas"][0]
            if len(result["user_datas"]) > 0
            else {},
        },
        room=user_id,
    )

    return "OK", 200


@sio.event
def disconnect(sid):
    session = sio.get_session(sid)

    if isFromWeb(session["connection_source"]) and "user_datas" in session:
        _ = call_request(
            r"""
                mutation updateUserData($userId: bigint!, $map: String!, $position: String!, $is_online: Boolean!) {
                    update_user_datas(where: {user_id: {_eq: $userId}}, _set: {map: $map, position: $position, is_online: $is_online}) {
                        affected_rows
                    }
                }
            """,
            {
                "userId": session["user_id"],
                "map": session["user_datas"]["map"],
                "position": f"{session['user_datas']['position']}",
                "is_online": False,
            },
        )

    sio.emit(
        "user_disconnect",
        {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            "user_role": session["user_role"],
        },
    )

    if "user_datas" in session:
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

        sio.leave_room(sid, session["user_datas"]["map"])

    sio.leave_room(sid, session["user_id"])
    print(f"User disconnected from game socket: {sid}\n\n")
    return "OK", 200


@sio.event
def send_action(sid, data):
    session = sio.get_session(sid)

    data_to_emit = {}
    if data["action"] == "initialize_data":
        initial_user_datas = {
            "map": "town",
            "position": f"{game.getRandomStartPosition('town')}",
        }

        try:
            _ = call_request(
                r"""
                    mutation insertUserData($userId: bigint!, $map: String!, $position: String!) {
                        insert_user_datas_one(object: {map: $map, position: $position, user_id: $userId}) {
                            id
                        }
                    }
                """,
                {"userId": session["user_id"], **initial_user_datas},
            )
        except Exception as e:
            return f"ERR: {e}", 500

        data_to_emit["action"] = {"action": data["action"], **initial_user_datas}

        data_to_emit["map"] = {
            "user_id": session["user_id"],
            "user_nickname": session["user_nickname"],
            **initial_user_datas,
        }

        session["user_datas"] = initial_user_datas
        sio.enter_room(sid, initial_user_datas["map"])
        sio.save_session(sid, session)

    elif data["action"] == "move":
        if session["user_datas"]:
            next_position = game.getNextPosition(
                session["user_datas"]["map"],
                session["user_datas"]["position"],
                data["direction"],
            )

            event_data = game.getNearbyEvent(
                session["user_datas"]["map"], next_position, 3
            )

            nearby_event_data = {
                "event_name": event_data[0] if event_data else None,
            }

            new_user_datas = {
                "map": session["user_datas"]["map"],
                "position": next_position,
            }

            data_to_emit["action"] = {
                "action": data["action"],
                "direction": data["direction"],
                **new_user_datas,
                **nearby_event_data,
            }

            data_to_emit["map"] = {
                "user_id": session["user_id"],
                "user_nickname": session["user_nickname"],
                **new_user_datas,
                **nearby_event_data,
            }

            session["user_datas"] = new_user_datas
            sio.save_session(sid, session)

    elif data["action"] == "run_event":
        if session["user_datas"]:
            event_data = game.getNearbyEvent(
                session["user_datas"]["map"],
                session["user_datas"]["position"],
            )

            nearby_event_data = {
                "event_name": event_data[0] if event_data and event_data[1] else None,
            }

            packed_data = {
                "packed_data": None,
            }
            if nearby_event_data["event_name"]:
                event_name, _ = event_data

                if event_name == "teleportation":
                    packed_data["packed_data"] = {
                        "maps": [x for x in game.maps if x.endswith("island")]
                    }

                session["chosen_event"] = event_name
                sio.save_session(sid, session)

            data_to_emit["action"] = {
                "action": data["action"],
                **nearby_event_data,
                **packed_data,
            }

    elif data["action"] == "run_action":
        packed_data = data["packed_data"]
        chosen_event = session["chosen_event"]

        error_data = {}
        success_data = {}
        if chosen_event and packed_data:
            if chosen_event == "teleportation":
                try:
                    eligible_maps = [x for x in game.maps if x.endswith("island")]

                    chosen_map = int(packed_data["chosen_map"])
                    new_user_datas = {
                        "map": eligible_maps[chosen_map],
                        "position": f"{game.getRandomStartPosition(eligible_maps[chosen_map])}",
                    }

                    data_to_emit["map"] = {
                        "user_id": session["user_id"],
                        "user_nickname": session["user_nickname"],
                        **new_user_datas,
                    }

                    sio.leave_room(sid, session["user_datas"]["map"])

                    session["chosen_event"] = None
                    session["user_datas"] = new_user_datas

                    sio.enter_room(sid, new_user_datas["map"])
                    sio.save_session(sid, session)

                    success_data = new_user_datas
                except:
                    error_data = {"error_text": "Your input data is wrong!"}

        if not packed_data:
            error_data = {"error_text": "Please give an input data first!"}

        if not chosen_event:
            error_data = {
                "error_text": """
                    \rChoose an event first by hitting "enter" or 
                    \r"spacebar" key on the event trigger location
                """
            }

        if error_data:
            data_to_emit["action"] = {
                "action": data["action"],
                **error_data,
            }

        if success_data:
            data_to_emit["action"] = {
                "action": data["action"],
                **success_data,
            }

    elif data["action"] == "clear_state":
        session["current_state"] = None
        session["chosen_event"] = None
        sio.save_session(sid, session)

    if "action" in data_to_emit and data_to_emit["action"]:
        sio.emit(
            "handle_action",
            data_to_emit["action"],
            room=session["user_id"],
            skip_sid=sid if data["action"] not in ["run_event", "run_action"] else None,
        )

    if "map" in data_to_emit and data_to_emit["map"]:
        sio.emit(
            "map_state",
            data_to_emit["map"],
            room=data_to_emit["map"]["map"],
            skip_sid=sid if data["action"] not in ["run_event", "run_action"] else None,
        )

    return "OK", 200


sio.register_namespace(ChatNamespace("/chat"))


if __name__ == "__main__":
    eventlet.wsgi.server(eventlet.listen(("", 5000)), app)
