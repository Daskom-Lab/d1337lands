import eventlet
import socketio

sio = socketio.Server()
app = socketio.WSGIApp(sio)

@sio.event
def connect(sid, environ):
    print(f"User connected: {sid}")
    user_id = authenticate_user(environ)
    sio.save_session(sid, {"user_id": user_id})
    sio.enter_room(sid, user_id)
    return "OK", 200

@sio.event
def disconnect(sid):
    print(f"User disconnected: {sid}")
    session = sio.get_session(sid)
    sio.leave_room(sid, session["user_id"])
    return "OK", 200

@sio.event
def send_action(sid, data):
    session = sio.get_session(sid)
    sio.emit("handle_action", data, room=session["user_id"], skip_sid=sid)
    sio.emit("map_state", data, room=data["map"], skip_sid=sid)
    return "OK", 200

if __name__ == '__main__':
    eventlet.wsgi.server(eventlet.listen(('', 3000)), app)