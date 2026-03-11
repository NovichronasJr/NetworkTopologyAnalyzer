import time
from scapy.all import ARP, Ether, srp
from scrapli import Scrapli
import re
import netifaces
import ipaddress
import networkx as nx
import json
import socket
import manuf
from networkx.readwrite import json_graph

# --- Configuration & State ---
ROUTER_MODE = False
SCRAPLI_BASE = {
    "auth_username": "admin",
    "auth_password": "password",
    "auth_strict_key": False,
    "platform": "cisco_iosxe",
    "timeout_socket": 10
}

# We keep the topology object globally so it "remembers" devices between scans
visited = set()
to_visit = set()
topology = nx.Graph()

# Initialize MAC Parser for Link-Type Guessing
try:
    mac_parser = manuf.MacParser()
except:
    mac_parser = None

def getCurrent_Network():
    """Returns local details, handling the 'No Connection' case."""
    try:
        gws = netifaces.gateways()
        # Check if a default gateway exists at all
        if 'default' not in gws or netifaces.AF_INET not in gws['default']:
            return [{
                "active_interface": "NONE",
                "local_ip": "127.0.0.1" # Loopback fallback
            }]
            
        active_iface = gws['default'][netifaces.AF_INET][1]
        addrs = netifaces.ifaddresses(active_iface)
        ip_address = addrs[netifaces.AF_INET][0]['addr']
        
        return [{
            "active_interface": active_iface,
            "local_ip": ip_address
        }]
    except Exception:
        return [{"active_interface": "OFFLINE", "local_ip": "0.0.0.0"}]



def get_current_subnet():
    """Robustly calculates the subnet and identifies the gateway IP."""
    try:
        gws = netifaces.gateways()
        # gateway_info is often (IP, Interface, True/False)
        gateway_info = gws['default'][netifaces.AF_INET]
        
        # FIX: Explicitly take only the first two values to avoid unpacking errors
        gateway_ip = gateway_info[0]
        interface = gateway_info[1]
        
        iface_data = netifaces.ifaddresses(interface)[netifaces.AF_INET][0]
        netmask = iface_data['netmask']
        
        # Create network object
        network = ipaddress.IPv4Interface(f"{gateway_ip}/{netmask}").network
        return str(network), gateway_ip
    except Exception as e:
        print(f"Error in get_current_subnet: {e}")
        return None, None

def find_devices():
    """Performs a Scapy ARP scan and resolves Hostnames for UI identity."""
    subnet, gateway_ip = get_current_subnet()
    if not subnet:
        return []

    print(f"📡 Scanning {subnet}...")
    
    # ARP Request setup
    arp_request = ARP(pdst=subnet)
    broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = broadcast/arp_request
    
    # answered is a list of tuples: (sent_packet, received_packet)
    answered, _ = srp(packet, timeout=3, verbose=False)
    
    devices = []
    for sent, received in answered:
        ip = received.psrc
        
        # 1. Identity Logic: Crucial for your Frontend End-Device/Gateway depiction
        if ip == gateway_ip:
            name = "_gateway"
        else:
            try:
                # Resolve hostname, fallback to '?' for your Node.js compatibility
                name = socket.gethostbyaddr(ip)[0]
            except (socket.herror, socket.gaierror):
                name = '?'

        devices.append({
            "name": name,
            "ip": ip,
            "mac": received.hwsrc
        })
    
    return devices

def discover_neighbors(ip):
    """Cisco-specific neighbor discovery via CDP/LLDP."""
    device = SCRAPLI_BASE.copy()
    device["host"] = ip
    neighbors = set()
    try:
        with Scrapli(**device) as conn:
            output = conn.send_command("show cdp neighbors detail").result
            neighbors.update(re.findall(r"IP address: (\S+)", output))
            output_lldp = conn.send_command("show lldp neighbors detail").result
            neighbors.update(re.findall(r"Management Address: (\S+)", output_lldp))
    except:
        pass
    return neighbors

def is_router_present(devices):
    """Check if any live IP responds to Cisco SSH commands."""
    for ip in devices:
        try:
            sock = socket.create_connection((ip, 22), timeout=1)
            sock.close()
            device = SCRAPLI_BASE.copy()
            device["host"] = ip
            with Scrapli(**device) as conn:
                output = conn.send_command("show cdp neighbors detail").result
                if "Device ID" in output or "IP address" in output:
                    return True
        except:
            continue
    return False

def get_interface_type(interface):
    if interface.startswith(("wl", "wlan", "wifi")): return "wifi"
    elif interface.startswith(("en", "eth", "eno", "ens")): return "ethernet"
    return "unknown"

def guess_remote_link_type(mac):
    """Uses OUI to guess if a device is on Wi-Fi (mobile vendors)."""
    if not mac or not mac_parser: return "ethernet"
    mobile_ouis = ("Apple", "Samsung", "Xiaomi", "Huawei", "OnePlus", "Motorola", "Realtek")
    try:
        vendor = mac_parser.get_manuf(mac)
        if vendor and any(v in vendor for v in mobile_ouis): return "wifi"
    except: pass
    return "ethernet"

def add_implicit_l2_device(devices, gateway_ip=None):
    """Creates the 'Ghost Hub' for star-topology visualization."""
    l2_node_id = "L2_SWITCH_AP"
    topology.add_node(l2_node_id, role="implicit-l2", discovered_by="inference", status="online")
    for ip in devices:
        topology.add_edge(l2_node_id, ip, relation="logical-L2")
    if gateway_ip:
        topology.add_edge(l2_node_id, gateway_ip, relation="uplink")
    return l2_node_id

def detect_real_loops(graph):
    """Identifies loops between infrastructure nodes (Red Link Alert)."""
    try:
        cycles = nx.cycle_basis(graph)
        real_loops = []
        for cycle in cycles:
            infra_nodes = [n for n in cycle if graph.nodes[n].get("role") in ("gateway", "implicit-l2")]
            if len(infra_nodes) > 1: real_loops.append(cycle)
        return real_loops
    except: return []

def save_topology(graph, filename="topology.json"):
    """Dumps the NetworkX graph to JSON for the frontend."""
    data = json_graph.node_link_data(graph)
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

# --- MAIN CONTINUOUS EXECUTION ---

# def run_continuous_scan():
#     """Main loop intended to be run in a background thread."""
#     print("🛰️ NOC CONTINUOUS SCANNER: Initializing...")
#     global visited, to_visit, topology

#     while True:
#         try:
#             # 1. Network Context
#             gws = netifaces.gateways()
#             gateway_info = gws['default'][netifaces.AF_INET]
#             gateway_ip, interface = gateway_info[0], gateway_info[1]
#             local_iface_type = get_interface_type(interface)

#             # 2. Discovery Phase
#             current_devices = find_devices()
#             live_ips = [d["ip"] for d in current_devices]
#             mac_map = {d["ip"]: d["mac"] for d in current_devices}

#             # 3. Persistence Logic: Mark all existing nodes as offline before updating
#             for node in topology.nodes:
#                 topology.nodes[node]["status"] = "offline"

#             # 4. Update Gateway
#             topology.add_node(gateway_ip, role="gateway", connection_type=local_iface_type, status="online")

#             # 5. Process Discovered Nodes
#             for ip in live_ips:
#                 topology.add_node(
#                     ip, 
#                     discovered_by="arp",
#                     connection_type=guess_remote_link_type(mac_map.get(ip)),
#                     mac_address=mac_map.get(ip),
#                     status="online" # Switch back to online
#                 )

#             # 6. Branching: Enterprise (CDP) vs Home (Implicit L2)
#             router_present = is_router_present(live_ips)
#             if router_present:
#                 to_visit.update(live_ips)
#                 while to_visit:
#                     ip = to_visit.pop()
#                     if ip in visited: continue
#                     visited.add(ip)
#                     neighbors = discover_neighbors(ip)
#                     for nbr in neighbors:
#                         topology.add_node(nbr, discovered_by="cdp/lldp", status="online", role="infrastructure")
#                         topology.add_edge(ip, nbr, relation="L3/L2")
#                         to_visit.add(nbr)
#             else:
#                 add_implicit_l2_device(live_ips, gateway_ip)

#             # 7. Audit: Loop Detection
#             topology.graph["real_loops"] = detect_real_loops(topology)

#             # 8. Save (This triggers the File Watcher in your Relay script)
#             save_topology(topology)
            
#             print(f"✅ Scan Synchronized. Nodes: {topology.number_of_nodes()} | Active: {len(live_ips)}")
#             time.sleep(30)

#         except Exception as e:
#             print(f"⚠️ Scanner Loop Interrupted: {e}")
#             time.sleep(10)

# if __name__ == "__main__":
#     # Test execution if run directly
#     run_continuous_scan()

# --- MAIN CONTINUOUS EXECUTION ---

def run_continuous_scan(scanner_event=None):
    """Main loop intended to be run in a background thread."""
    print("🛰️ NOC CONTINUOUS SCANNER: Initializing...")
    global visited, to_visit, topology

    # CRITICAL: Check the event flag instead of 'while True'
    while scanner_event is None or scanner_event.is_set():
        try:
            # 1. Network Context
            gws = netifaces.gateways()
            gateway_info = gws['default'][netifaces.AF_INET]
            gateway_ip, interface = gateway_info[0], gateway_info[1]
            local_iface_type = get_interface_type(interface)

            # 2. Discovery Phase
            current_devices = find_devices()
            live_ips = [d["ip"] for d in current_devices]
            mac_map = {d["ip"]: d["mac"] for d in current_devices}

            # 3. Persistence Logic: Mark all existing nodes as offline before updating
            for node in topology.nodes:
                topology.nodes[node]["status"] = "offline"

            # 4. Update Gateway
            topology.add_node(gateway_ip, role="gateway", connection_type=local_iface_type, status="online")

            # 5. Process Discovered Nodes
            for ip in live_ips:
                topology.add_node(
                    ip, 
                    discovered_by="arp",
                    connection_type=guess_remote_link_type(mac_map.get(ip)),
                    mac_address=mac_map.get(ip),
                    status="online" # Switch back to online
                )

            # 6. Branching: Enterprise (CDP) vs Home (Implicit L2)
            router_present = is_router_present(live_ips)
            if router_present:
                to_visit.update(live_ips)
                while to_visit:
                    ip = to_visit.pop()
                    if ip in visited: continue
                    visited.add(ip)
                    neighbors = discover_neighbors(ip)
                    for nbr in neighbors:
                        topology.add_node(nbr, discovered_by="cdp/lldp", status="online", role="infrastructure")
                        topology.add_edge(ip, nbr, relation="L3/L2")
                        to_visit.add(nbr)
            else:
                add_implicit_l2_device(live_ips, gateway_ip)

            # 7. Audit: Loop Detection
            topology.graph["real_loops"] = detect_real_loops(topology)

            # 8. Save (This triggers the File Watcher in your Relay script)
            save_topology(topology)
            
            print(f"✅ Scan Synchronized. Nodes: {topology.number_of_nodes()} | Active: {len(live_ips)}")
            
            # RESPONSIVE SLEEP: Instead of blocking for 30 seconds, 
            # we sleep in 1-second chunks and constantly check if we should stop.
            for _ in range(30):
                if scanner_event and not scanner_event.is_set():
                    break # Break the sleep loop immediately if Halt is pressed
                time.sleep(1)

        except Exception as e:
            print(f"⚠️ Scanner Loop Interrupted: {e}")
            # Also break out safely if an error happens while we are trying to stop
            if scanner_event and not scanner_event.is_set():
                break
            time.sleep(5)
            
    print("🛑 Heavy-lifting Scanner Engine halted cleanly.")

if __name__ == "__main__":
    # Test execution if run directly (No event passed, runs once or indefinitely depending on your logic)
    run_continuous_scan()
