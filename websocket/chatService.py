import socketio
import requests
import json

auth_validation_url = "http://localhost:4444/api/authentication/validate"

class ChatNamespace(socketio.Namespace):
    def connect(self, sid, _, auth):
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

        print(f"User connected: {sid}")

        return "OK", 200

    def disconnect(self, sid):
        return "OK", 200

    def send_message(self, sid, data):
        self.emit(data, skip_sid=sid)