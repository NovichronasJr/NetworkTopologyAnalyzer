#!/bin/bash

cd client && npm run dev &

cd Relay_server && npm start &

cd local_script && npm start &

wait
