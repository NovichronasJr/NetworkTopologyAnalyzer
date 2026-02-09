#!/bin/bash
# This kills all background jobs started by this script when you exit
trap "kill 0" EXIT
# 1. Start the core servers first
(cd backend && npm start) &
(cd Relay_server && npm start) &
(cd client && npm run dev) &
#(cd local_script && npm start) &
# 2. Wait a few seconds for the ports to open
echo "Waiting for servers to initialize..."
sleep 8

# 3. Now start the UI and the Python local script

(cd local_script_python && sudo ./myenv/bin/python script.py) &

wait