# import subprocess
# import json
# import xml.etree.ElementTree as ET
# import os

# def run_nmap_to_json(target_ip):
#     # Check for root privileges (required for -sS and -O)
#     if os.geteuid() != 0:
#         print("❌ Error: This scan requires root privileges.")
#         print("Please run with: sudo python3 your_script.py")
#         return

#     # -oX - sends XML to stdout for parsing
#     # -Pn treats host as online (prevents failure if ping is blocked)
#     command = [
#         "nmap", "-p-", "-sS", "-sV", "-O", 
#         "--osscan-guess", "-T4", "-Pn", "-oX", "-", 
#         target_ip
#     ]
    
#     print(f"🚀 Scanning {target_ip}...")
#     print("Capturing structured data for EtherScan dashboard. Please wait...")

#     try:
#         # Run nmap and capture output
#         result = subprocess.run(command, capture_output=True, text=True, check=True)
        
#         if not result.stdout.strip():
#             print("❌ Nmap returned empty output. Check target connectivity.")
#             return

#         # Parse the XML string
#         root = ET.fromstring(result.stdout)
        
#         # Structure the base JSON object
#         scan_results = {
#             "target": target_ip,
#             "status": "unknown",
#             "os_match": [],
#             "ports": []
#         }

#         # Get host status
#         status_node = root.find(".//status")
#         if status_node is not None:
#             scan_results["status"] = status_node.get("state")

#         # Extract OS matches
#         for os_match in root.findall(".//osmatch"):
#             scan_results["os_match"].append({
#                 "name": os_match.get("name"),
#                 "accuracy": os_match.get("accuracy")
#             })

#         # Extract Port details
#         for port in root.findall(".//port"):
#             state_node = port.find("state")
#             service_node = port.find("service")
            
#             port_info = {
#                 "portid": port.get("portid"),
#                 "protocol": port.get("protocol"),
#                 "state": state_node.get("state") if state_node is not None else "unknown",
#                 "service": "unknown",
#                 "product": "unknown",
#                 "version": "unknown"
#             }
            
#             if service_node is not None:
#                 port_info["service"] = service_node.get("name", "unknown")
#                 port_info["product"] = service_node.get("product", "unknown")
#                 port_info["version"] = service_node.get("version", "unknown")
            
#             scan_results["ports"].append(port_info)

#         # Write to JSON file
#         output_file = "scan_results.json"
#         with open(output_file, "w") as f:
#             json.dump(scan_results, f, indent=4)

#         print("-" * 30)
#         print(f"✅ Success! Found {len(scan_results['ports'])} open ports.")
#         print(f"📄 Data saved to: {output_file}")

#     except ET.ParseError:
#         print("❌ XML Parse Error: Nmap output was interrupted or malformed.")
#         # Save raw output for debugging
#         with open("nmap_debug.log", "w") as f:
#             f.write(result.stdout)
#         print("Check 'nmap_debug.log' to see the raw response.")
#     except subprocess.CalledProcessError as e:
#         print(f"❌ Nmap failed: {e}")
#     except Exception as e:
#         print(f"❌ Unexpected Error: {e}")

# if __name__ == "__main__":
#     target = input("Enter target IP: ").strip()
#     if target:
#         run_nmap_to_json(target)
#     else:
#         print("Target IP is required.")

import subprocess
import json
import xml.etree.ElementTree as ET
import os

def run_nmap_to_json(target_ip):
    # Check for root privileges (required for -sS and -O)
    if os.name != 'nt' and os.geteuid() != 0:
        print("❌ Error: This scan requires root privileges.")
        print("Please run your MAIN socket script with: sudo python3 your_main_script.py")
        return

    # Removed -p- and added --top-ports 1000 for faster/more stable testing
    # command = [
    #     "nmap", "--top-ports", "1000", "-sS", "-sV", "-O", 
    #     "--osscan-guess", "-T4", "-Pn", "-oX", "-", 
    #     target_ip
    # ]
    command = [
        "nmap", "--top-ports", "1000", 
        "-sT", # Use standard TCP connect (Fixes the dnet error)
        "-sV", # Version detection (Will often grab the OS info anyway)
        "-T4", "-Pn", "-oX", "-", 
        target_ip
    ]
    
    print(f"🚀 Scanning {target_ip}...")
    print("Capturing structured data for EtherScan dashboard. Please wait...")

    try:
        # Run nmap and capture output
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        if not result.stdout.strip():
            print("❌ Nmap returned empty output. Check target connectivity.")
            return

        # Parse the XML string
        root = ET.fromstring(result.stdout)
        
        # Structure the base JSON object
        scan_results = {
            "target": target_ip,
            "status": "unknown",
            "os_match": [],
            "ports": []
        }

        # Get host status
        status_node = root.find(".//status")
        if status_node is not None:
            scan_results["status"] = status_node.get("state")

        # Extract OS matches
        for os_match in root.findall(".//osmatch"):
            scan_results["os_match"].append({
                "name": os_match.get("name"),
                "accuracy": os_match.get("accuracy")
            })

        # Extract Port details
        for port in root.findall(".//port"):
            state_node = port.find("state")
            service_node = port.find("service")
            
            port_info = {
                "portid": port.get("portid"),
                "protocol": port.get("protocol"),
                "state": state_node.get("state") if state_node is not None else "unknown",
                "service": "unknown",
                "product": "unknown",
                "version": "unknown"
            }
            
            if service_node is not None:
                port_info["service"] = service_node.get("name", "unknown")
                port_info["product"] = service_node.get("product", "unknown")
                port_info["version"] = service_node.get("version", "unknown")
            
            scan_results["ports"].append(port_info)

        # Write to JSON file
        output_file = "scan_results.json"
        with open(output_file, "w") as f:
            json.dump(scan_results, f, indent=4)

        print("-" * 30)
        print(f"✅ Success! Found {len(scan_results['ports'])} open ports.")
        print(f"📄 Data saved to: {output_file}")

    except ET.ParseError:
        print("❌ XML Parse Error: Nmap output was interrupted or malformed.")
        with open("nmap_debug.log", "w") as f:
            f.write(result.stdout)
        print("Check 'nmap_debug.log' to see the raw response.")
        
    # 🔥 THIS IS THE MAGIC FIX 🔥
    except subprocess.CalledProcessError as e:
        print(f"❌ Nmap failed with exit code {e.returncode}")
        print(f"⚠️ Nmap Error Details:\n{e.stderr}") # This reveals the REAL problem!
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    target = input("Enter target IP: ").strip()
    if target:
        run_nmap_to_json(target)
    else:
        print("Target IP is required.")