# import socketio
# import webbrowser
# import time
# import json
# import os
# import threading
# from scan import find_devices,getCurrent_Network

# # 1. Use the Synchronous client (often more stable for local relay setups)
# sio = socketio.Client(logger=True, engineio_logger=True) 

# SERVER_URL = 'http://localhost:8001'

# @sio.event
# def connect():
#     # sio.sid can sometimes be the wrong ID layer. 
#     # Let's ensure we use the one the server just confirmed.
#     actual_id = sio.get_sid() 
#     print(f"Connected! Internal ID: {actual_id}")
#     ip_details = getCurrent_Network()
#     time.sleep(1)
#     # Match the Node.js behavior exactly
#     print(f"emitting the ip details -----> {ip_details}")
#     sio.emit("pair_formation_loc", {"loc_id": actual_id,"ip_details":ip_details})
#     print(f"Sent pairing ID {actual_id} to server.")
    
#     webbrowser.open('http://localhost:3000',1,True)


# @sio.on('ETH_SCAN')
# def eth_scan():
#     print("🚀 Ethernet analysis initiated...")
    
#     # Path to your topology file at the root
#     file_path = "topology.json"
    
#     try:
#         if os.path.exists(file_path):
#             with open(file_path, 'r') as f:
#                 topology_data = json.load(f)
            
#             # Emit the parsed data
#             sio.emit("ETH_SCAN_RESULTS", {'devices': topology_data})
#             print("✅ Topology data dispatched to server.")
#         else:
#             print(f"❌ Error: {file_path} not found.")
#             sio.emit("ETH_SCAN_ERROR", {'message': 'Topology file missing on host.'})
            
#     except Exception as e:
#         print(f"❌ Critical Failure: {e}")
#         sio.emit("ETH_SCAN_ERROR", {'message': str(e)})


# @sio.on('SCAN_LOCAL_DEVICES')
# def on_scan_local_devices():
#     print(">>> MESSAGE RECEIVED: SCAN_LOCAL_DEVICES")
    
#     # We run the scan in a thread so we don't block the Socket connection
#     # If the connection blocks, the server might drop the client
#     def do_scan():
#         try:
#             devices = find_devices()
#             print(f"Scan finished. Found {len(devices)} devices.")
#             sio.emit('LOCAL_DEVICE_SCANNED_RESULTS', {
#                 'scr_id': sio.sid,
#                 'devices': devices
#             })
#         except Exception as e:
#             print(f"Scan error: {e}")

#     threading.Thread(target=do_scan).start()

# @sio.on('message')
# def on_message(data):
#     print(f"Server says: {data}")

# if __name__ == '__main__':
#     while True:
#         try:
#             if not sio.connected:
#                 print("Attempting to connect...")
#                 sio.connect(SERVER_URL)
#             sio.wait()
#         except Exception as e:
#             print(f"Connection failed: {e}. Retrying...")
#             time.sleep(2)


import socketio
import time
import threading
import json
import os
import netifaces
import webbrowser
from scan import find_devices, run_continuous_scan, getCurrent_Network

# Initialize Socket.io Client
sio = socketio.Client(logger=False, engineio_logger=False) 
SERVER_URL = 'http://localhost:8001'

# Global State Management
scanner_running = threading.Event() 
current_active_interface = None
last_mod_time = 0

# --- 1. HARDWARE GUARDIAN (The Monitor Thread) ---
def hardware_monitor():
    """Continuously monitors for physical link AND IP address changes."""
    global current_active_interface
    current_ip = None # Track the IP specifically
    print("🛡️ Hardware Guardian: Monitoring link and IP states...")
    
    while True:
        try:
            gws = netifaces.gateways()
            
            # CASE 1: ACTIVE CONNECTION DETECTED
            if 'default' in gws and netifaces.AF_INET in gws['default']:
                new_interface = gws['default'][netifaces.AF_INET][1]
                
                # Get the actual IP for this specific interface
                addrs = netifaces.ifaddresses(new_interface)
                new_ip = addrs[netifaces.AF_INET][0]['addr']
                
                # TRIGGER: If the interface name OR the IP address has changed
                if new_interface != current_active_interface or new_ip != current_ip:
                    current_active_interface = new_interface
                    current_ip = new_ip
                    
                    print(f"🔄 Network Shift: {new_interface} | IP: {new_ip}")
                    
                    sio.emit("INTERFACE_STATE_CHANGE", {
                        "active_interface": new_interface,
                        "ip": new_ip,
                        "status": "ONLINE",
                        "is_ethernet": new_interface.startswith(('eth', 'en', 'em', 'eno', 'ens'))
                    })
            
            # CASE 2: TOTAL BLACKOUT
            else:
                if current_active_interface != "NONE":
                    current_active_interface = "NONE"
                    current_ip = "0.0.0.0"
                    print("⚠️ Hardware Link Lost: System is offline.")
                    sio.emit("INTERFACE_STATE_CHANGE", {
                        "active_interface": "DISCONNECTED",
                        "ip": "0.0.0.0",
                        "status": "OFFLINE",
                        "is_ethernet": False
                    })
            
            time.sleep(2) 
        except Exception as e:
            # Silently handle transient errors (like when an IP is 'halfway' assigned)
            time.sleep(2)

# --- 2. SOCKET EVENTS ---
@sio.event
def connect():
    actual_id = sio.get_sid() 
    print(f"✅ Connected to NOC Server. ID: {actual_id}")
    
    # Send initial network state for pairing
    ip_details = getCurrent_Network()
    sio.emit("pair_formation_loc", {"loc_id": actual_id, "ip_details": ip_details})
    
    # Auto-open dashboard on successful connection
    webbrowser.open('http://localhost:3000', new=1)

# --- MODE A: ONE-SHOT NETWORK SCAN (WiFi) ---
@sio.on('SCAN_LOCAL_DEVICES')
def on_scan_local_devices():
    print("📡 [WIFI MODE] One-shot scan request received.")
    
    def do_scan():
        try:
            devices = find_devices()
            sio.emit('LOCAL_DEVICE_SCANNED_RESULTS', {
                'scr_id': sio.sid,
                'devices': devices
            })
            print(f"✅ Wifi Scan Complete. {len(devices)} nodes found.")
        except Exception as e:
            print(f"❌ Wifi Scan Error: {e}")

    threading.Thread(target=do_scan, daemon=True).start()

# --- MODE B: CONTINUOUS ETHERNET SCAN ---
@sio.on('ETH_SCAN')
def eth_scan():
    """Triggered by the UI. Starts the continuous engine if idle."""
    print("🚀 [ETH MODE] Initiating Continuous Analysis...")
    
    if not scanner_running.is_set():
        scanner_running.set()
        # Start the heavy-lifting scanner
        threading.Thread(target=run_continuous_scan, daemon=True).start()
        # Start the watcher to push updates
        threading.Thread(target=file_watcher, daemon=True).start()
    else:
        print("ℹ️ Engine already warm. Syncing current topology...")
        push_topology_data()

# --- 3. DATA SYNC HELPERS ---
def file_watcher():
    """Watches topology.json for changes made by the continuous scanner."""
    global last_mod_time
    print("🔭 Topology Watcher: Monitoring for data updates...")
    while True:
        push_topology_data()
        time.sleep(2)

def push_topology_data():
    global last_mod_time
    file_path = "topology.json"
    try:
        if os.path.exists(file_path):
            current_mod_time = os.path.getmtime(file_path)
            if current_mod_time != last_mod_time:
                with open(file_path, 'r') as f:
                    topology_data = json.load(f)
                sio.emit("ETH_SCAN_RESULTS", {'devices': topology_data})
                last_mod_time = current_mod_time
    except Exception as e:
        print(f"⚠️ Watcher Sync Error: {e}")

# --- 4. EXECUTION ENTRY POINT ---
if __name__ == '__main__':
    # Invoke the Hardware Guardian thread immediately
    guardian_thread = threading.Thread(target=hardware_monitor, daemon=True)
    guardian_thread.start()

    # Main Socket Connection Loop
    while True:
        try:
            if not sio.connected:
                print("Connecting to NOC Server...")
                sio.connect(SERVER_URL)
            sio.wait()
        except Exception as e:
            print(f"Connection failed: {e}. Retrying in 2s...")
            time.sleep(2)