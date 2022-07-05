import eventlet
import socketio
import requests
import json

from subservices.chatService import ChatNamespace
from util.game import Game
from util.query import call_gql_request, call_http_request


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


def prettify(string):
    return "\n".join(" ".join(line.split()) for line in string.strip().split("\n"))


@sio.event
def connect(sid, _, auth):
    req = call_http_request("/authentication/validate", auth["token"], method="POST")
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
        "user_authtoken": auth["token"],
        "connection_source": auth["connection_source"],
    }

    sio.save_session(sid, user_session)

    result = {"user_datas": []}

    try:
        result = call_gql_request(
            r"""
                query getUserData ($userId: bigint!) {
                    user_datas(where: {user_id: {_eq: $userId}}) {
                        map
                        position
                        user {
                            character
                            chosen_title
                        }
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

        if isFromWeb(auth["connection_source"]):
            _ = call_gql_request(
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

            r = call_http_request("/user/presence", auth["token"])
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
                                "character": user["character"],
                                "chosen_title": user["chosen_title"],
                            },
                        },
                        room=user_id,
                    )

    print(f"User connected to game socket: {sid}\n\n")

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
        _ = call_gql_request(
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
            _ = call_gql_request(
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

                current_map = session["user_datas"]["map"]
                if current_map == "town":
                    if event_name == "teleportation":
                        packed_data["packed_data"] = {"maps": game.getIslandMaps()}
                    elif event_name == "shop":
                        req = call_http_request(
                            "/shop/list", session["user_authtoken"], {}
                        )
                        packed_data["packed_data"] = {
                            "shop_list": json.loads(req.text)["result"]
                        }
                    elif event_name == "leaderboard":
                        result = call_gql_request(
                            r"""
                                query getUsers {
                                    users(order_by: {leetcoin: desc}) {
                                        id
                                        nickname
                                    }
                                }
                            """,
                        )

                        if len(result["users"]) > 0:
                            leetcoin_list = [res["id"] for res in result["users"]]

                        req = call_http_request(
                            "/user/achievement", session["user_authtoken"], {}
                        )

                        achievements = {}
                        for res in json.loads(req.text)["result"]:
                            try:
                                achievements[res["id"]] += 1
                            except:
                                achievements[res["id"]] = 1

                        achievement_list = []
                        for key, _ in sorted(
                            achievements.items(), key=lambda item: item[1], reverse=True
                        ):
                            achievement_list.append(key)
                            leetcoin_list.remove(key)

                        achievement_list.extend(leetcoin_list)

                        score_list = []
                        for x in achievement_list:
                            score_list.append(
                                {
                                    "user_id": x,
                                    "user_nickname": next(
                                        item.nickname
                                        for item in result["users"]
                                        if int(item["id"]) == x
                                    ),
                                }
                            )

                        packed_data["packed_data"] = {
                            "achievement_list": score_list,
                        }
                    elif event_name == "hall_of_fame":
                        req = call_http_request(
                            "/user/titles", session["user_authtoken"], {}
                        )

                        user_list = {}
                        for title in json.loads(req.text)["result"]:
                            try:
                                user_list[title["nickname"]].append(
                                    {
                                        "title": title["title"],
                                        "description": title["description"],
                                    }
                                )
                            except:
                                user_list[title["nickname"]] = [
                                    {
                                        "title": title["title"],
                                        "description": title["description"],
                                    }
                                ]

                        user_list = dict(
                            sorted(
                                user_list.items(),
                                key=lambda item: item[1],
                                reverse=True,
                            )
                        )

                        packed_data["packed_data"] = {"user_list": user_list}
                    elif (
                        event_name == "mentor_castle_right"
                        or event_name == "mentor_castle_left"
                    ):
                        if session["user_role"] != "mentor":
                            data_to_emit["action"] = {
                                "action": data["action"],
                                "error_text": "Hold on right there codeventurer, you are not a mentor!",
                            }
                        else:
                            new_user_datas = {
                                "map": "mentorcastle",
                                "position": f"""{game.getRandomStartPosition('mentorcastle', 
                                    which=event_name.split('mentor_castle_')[1])}""".strip(),
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
                elif current_map == "mentorcastle":
                    if event_name == "submission_check":
                        req = call_http_request(
                            "/mentor/check", session["user_authtoken"], {}
                        )
                        packed_data["packed_data"] = {
                            "submission_list": json.loads(req.text)["result"]
                        }
                    elif (
                        event_name == "teleportation_right"
                        or event_name == "teleportation_left"
                    ):
                        new_user_datas = {
                            "map": "town",
                            "position": f"""{
                                game.getRandomStartPosition('town', 
                                    game.maps_data['town']['events']
                                        ['mentor_castle_' + event_name.split('teleportation_')[1]]
                                )}
                            """.strip(),
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
                else:
                    if event_name == "hint":
                        packed_data["packed_data"] = {
                            "prompt": prettify(
                                """
                                    Hello there codeventurer, tell me which quest that
                                    you are stuck with and what kind of hints you want me to give!

                                    Remember that i only accept your wishes in this format 
                                    {quest_id}#{free||paid}

                                    ex: 1#free

                                    You can find the quest_id from a person that will give you quest
                                    when you talk to em!
                                """
                            )
                        }
                    elif event_name == "quest":
                        req = call_http_request(
                            "/quest/list",
                            session["user_authtoken"],
                            {"category": current_map},
                        )
                        packed_data["packed_data"] = {
                            "submission_list": json.loads(req.text)["result"]
                        }
                    elif event_name == "submission":
                        req = call_http_request(
                            "/quest/submission", session["user_authtoken"], {}
                        )
                        packed_data["packed_data"] = {
                            "submission_list": json.loads(req.text)["result"]
                        }
                    elif event_name == "submit_quest":
                        packed_data["packed_data"] = {
                            "prompt": prettify(
                                """
                                    Hello there codeventurer, you must've been in a very long 
                                    code journey aint ya ?

                                    You can submit your answer to me and worry not, i will pass 
                                    it on to the mentors in the castle... i accept your answer
                                    in this kind of format
                                    {quest_id}###{answer}

                                    ex: 1###https://paste.sh/6IktKHqS\#Kg-rYPIyi7DLM_De-8kNr5ma

                                    Note that i only accept the answer part in a kind of URL (Uniform
                                    Resource Locators) and please dont give me your localhost URL or the
                                    mentors are going to be very mad at me, and they might fire me :((
                                """
                            )
                        }
                    elif event_name == "teleportation":
                        new_user_datas = {
                            "map": "town",
                            "position": f"""{
                                game.getRandomStartPosition('town', 
                                    game.maps_data['town']['events']['teleportation']
                                )}
                            """.strip(),
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
            current_map = session["user_datas"]["map"]
            if current_map == "town":
                if chosen_event == "teleportation":
                    try:
                        eligible_maps = game.getIslandMaps()

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
                elif chosen_event == "shop":
                    try:
                        res = call_http_request(
                            "/shop/buy",
                            session["user_authtoken"],
                            {"potion_id": int(packed_data["chosen_potion"])},
                            method="POST",
                        )

                        if res.status_code != 200:
                            error_data = {
                                "error_text": prettify(
                                    """
                                        Something is wrong in the system,
                                        please try again later!
                                    """
                                )
                            }
                        else:
                            success_data = {
                                "success_text": json.loads(res.text)["result"]
                            }
                    except:
                        error_data = {"error_text": "Your input data is wrong!"}
            elif current_map == "mentorcastle":
                if chosen_event == "submission_check":
                    try:
                        submission_id, is_correct = packed_data[
                            "correction_data"
                        ].split("#")
                        res = call_http_request(
                            "/mentor/correction",
                            session["user_authtoken"],
                            {
                                "submission_id": int(submission_id),
                                "is_correct": is_correct,
                            },
                            method="POST",
                        )

                        if res.status_code != 200:
                            error_data = {
                                "error_text": prettify(
                                    """
                                        Something is wrong in the system,
                                        please try again later!
                                    """
                                )
                            }
                        else:
                            success_data = {
                                "success_text": json.loads(res.text)["result"]
                            }
                    except:
                        error_data = {"error_text": "Your input data is wrong!"}
            else:
                if chosen_event == "hint":
                    try:
                        quest_id, hint_kind = packed_data["hint_data"].split("#")

                        if hint_kind not in ["free", "paid"]:
                            error_data = {
                                "error_text": 'Hint kind can only be either "free" or "paid"'
                            }

                        res = call_http_request(
                            f"/quest/{hint_kind}hint",
                            session["user_authtoken"],
                            {
                                "quest_id": int(quest_id),
                            },
                        )

                        if res.status_code != 200:
                            error_data = {
                                "error_text": prettify(
                                    """
                                        Something is wrong in the system,
                                        please try again later!
                                    """
                                )
                            }
                        else:
                            success_data = {
                                "success_text": json.loads(res.text)["result"]
                            }
                    except:
                        error_data = {"error_text": "Your input data is wrong!"}
                elif chosen_event == "submission":
                    try:
                        res = call_http_request(
                            "/quest/redeem",
                            session["user_authtoken"],
                            {
                                "submission_id": int(packed_data["chosen_submission"]),
                            },
                            method="POST",
                        )

                        if res.status_code != 200:
                            error_data = {
                                "error_text": prettify(
                                    """
                                        Something is wrong in the system,
                                        please try again later!
                                    """
                                )
                            }
                        else:
                            success_data = {
                                "success_text": json.loads(res.text)["result"]
                            }
                    except:
                        error_data = {"error_text": "Your input data is wrong!"}
                elif chosen_event == "submit_quest":
                    try:
                        quest_id, answer = packed_data["quest_answer_data"].split("###")

                        res = call_http_request(
                            "/quest/submit",
                            session["user_authtoken"],
                            {
                                "quest_id": int(quest_id),
                                "answer": answer,
                            },
                            method="POST",
                        )

                        if res.status_code != 200:
                            error_data = {
                                "error_text": prettify(
                                    """
                                        Something is wrong in the system,
                                        please try again later!
                                    """
                                )
                            }
                        else:
                            success_data = {
                                "success_text": json.loads(res.text)["result"]
                            }
                    except:
                        error_data = {"error_text": "Your input data is wrong!"}

        if not packed_data:
            error_data = {"error_text": "Please give an input data first!"}

        if not chosen_event:
            error_data = {
                "error_text": prettify(
                    """
                        Choose an event first by hitting "enter" or 
                        "spacebar" key on the event trigger location
                    """
                )
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
