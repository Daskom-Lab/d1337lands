import socketio
import requests
import json

auth_validation_url = "http://webservice:3000/api/authentication/validate"

class ChatNamespace(socketio.Namespace):
    def on_connect(self, sid, _, auth):
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

        self.save_session(sid, user_session)

        print(f"User connected to chat socket: {sid}", flush=True)
        return "OK", 200

    def on_disconnect(self, sid):
        print(f"User disconnected from chat socket: {sid}", flush=True)
        return "OK", 200

    def on_send_message(self, sid, data):
        session = self.get_session(sid)

        data_to_emit = {
            "user_nickname": session["user_nickname"],
            "user_role": session["user_role"],
            "user_chat": data
        }

        self.emit("send_message", data_to_emit, skip_sid=sid)
        return data_to_emit, 200
