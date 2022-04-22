import eventlet
import socketio
import requests

sio = socketio.Server()
app = socketio.WSGIApp(sio)

url = "http://localhost:4444/api/authentication/validate"

@sio.event
def connect(sid, environ):
    user_id = requests.post(url, headers={"Authorization": f"Bearer {environ['HTTP_AUTH']}"})
    if (user_id.text == "401"):
        return "ERR", 401
    sio.save_session(sid, {"user_id": user_id})
    sio.enter_room(sid, user_id)
    print(f"User connected: {sid}")
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
    sio.emit("handle_action", data, room=session["user_id"], skip_sid=sid)
    sio.emit("map_state", data, room=data["map"], skip_sid=sid)
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
    eventlet.wsgi.server(eventlet.listen(('', 3000)), app)