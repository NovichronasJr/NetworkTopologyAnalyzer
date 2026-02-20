const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();
const http_server = http.createServer(app);
const io = new Server(http_server,{
    cors:{ origin:"http://localhost:3000", methods:["GET","POST"] }
});

const PORT = 8001;
// We define a static ROOM name. In a multi-user app, this would be the User's Email.
const SESSION_ROOM = "NOC_SESSION_ROOM"; 

let local_network = null;

io.on('connection',(socket)=>{
    console.log("New socket connected: " + socket.id);  
    
    // 1. Every socket (Script or Client) joins the same Room immediately
    socket.join(SESSION_ROOM);

    socket.emit('message', {message: "welcome to the topo"});
    
    // --- PAIRING (Kept your parameters exactly as requested) ---
    socket.on('pair_formation_loc', ({loc_id, ip_details}) => {
        console.log("Script paired: " + loc_id);
        local_network = ip_details;
        // Even if the script reconnects, it's already in the SESSION_ROOM
    });

    socket.on('pair_formation_client', ({cli_id}) => {
        console.log("Client paired: " + cli_id);
        // Push current network details back to the client immediately
        io.to(SESSION_ROOM).emit('NETWORK_DETAILS', {net_details: local_network});
    });

    // --- WIFI SCAN ---
    socket.on('INITIATE_SCAN', (data) => {
        // Instead of map.get, we broadcast to the ROOM. 
        // The Script is in the room, so it will hear this.
        socket.to(SESSION_ROOM).emit('SCAN_LOCAL_DEVICES');
    });

    socket.on('LOCAL_DEVICE_SCANNED_RESULTS', ({scr_id, devices}) => {
        // Forward results to the Client in the room
        socket.to(SESSION_ROOM).emit('SCAN_RESULTS', {devices: devices});
    });

    // --- ETHERNET SCAN ---
    socket.on("INITIATE_ETH_SCAN", () => {
        socket.to(SESSION_ROOM).emit("ETH_SCAN");
    });

    socket.on('ETH_SCAN_RESULTS', ({devices}) => {
        socket.to(SESSION_ROOM).emit('ETH_DEVICES', {devices: devices});
    });

    // --- THE FIX: INTERFACE CHANGE ---
    socket.on('INTERFACE_STATE_CHANGE', (data) => {
        console.log("Relay server :: interface change found :: ", data);
        // We broadcast to the ROOM. If the client just reconnected, 
        // as long as it joined the room, it WILL receive this.
        socket.to(SESSION_ROOM).emit('INTERFACE_STATE_CHANGE', data); 
    });

    socket.on('disconnect', () => {
        console.log("Socket disconnected: " + socket.id);
    });
});

http_server.listen(PORT, () => {
    console.log(`App listening on http://localhost:${PORT}`);
});