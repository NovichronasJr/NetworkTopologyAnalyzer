import socketio
import webbrowser
import time
import threading
from scan import find_devices,getCurrent_Network

# 1. Use the Synchronous client (often more stable for local relay setups)
sio = socketio.Client(logger=True, engineio_logger=True) 

SERVER_URL = 'http://localhost:8001'

@sio.event
def connect():
    # sio.sid can sometimes be the wrong ID layer. 
    # Let's ensure we use the one the server just confirmed.
    actual_id = sio.get_sid() 
    print(f"Connected! Internal ID: {actual_id}")
    ip_details = getCurrent_Network()
    time.sleep(1)
    # Match the Node.js behavior exactly
    print(f"emitting the ip details -----> {ip_details}")
    sio.emit("pair_formation_loc", {"loc_id": actual_id,"ip_details":ip_details})
    print(f"Sent pairing ID {actual_id} to server.")
    
    webbrowser.open('http://localhost:3000')

@sio.on('SCAN_LOCAL_DEVICES')
def on_scan_local_devices():
    print(">>> MESSAGE RECEIVED: SCAN_LOCAL_DEVICES")
    
    # We run the scan in a thread so we don't block the Socket connection
    # If the connection blocks, the server might drop the client
    def do_scan():
        try:
            devices = find_devices()
            print(f"Scan finished. Found {len(devices)} devices.")
            sio.emit('LOCAL_DEVICE_SCANNED_RESULTS', {
                'scr_id': sio.sid,
                'devices': devices
            })
        except Exception as e:
            print(f"Scan error: {e}")

    threading.Thread(target=do_scan).start()

@sio.on('message')
def on_message(data):
    print(f"Server says: {data}")

if __name__ == '__main__':
    while True:
        try:
            if not sio.connected:
                print("Attempting to connect...")
                sio.connect(SERVER_URL)
            sio.wait()
        except Exception as e:
            print(f"Connection failed: {e}. Retrying...")
            time.sleep(2)