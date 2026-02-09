const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();

const http_server = http.createServer(app);

const io = new Server(http_server,{
    cors:{
        origin:"http://localhost:3000",
        methods:["GET","POST"]
    }
});

const PORT = 8001;

const map = new Map();

let scr_socket_id = null;
let cli_socket_id = null;
let local_network = null;

io.on('connection',(socket)=>{
    console.log("new socket connected "+socket.id);  
    socket.emit('message',{message:"welcome to the topo"})
    
//==================================================================================================================================
// Forming a pair between client and server 
    socket.on('pair_formation_loc',({loc_id,ip_details})=>{
        scr_socket_id = loc_id;
        console.log("srcipt :: " + loc_id);
        console.log("local_network :: "+ip_details);
        local_network = ip_details;
    })

    socket.on('pair_formation_client',({cli_id})=>{
        cli_socket_id = cli_id;
        console.log("client :: " + cli_id);

        if(scr_socket_id && cli_socket_id)
        {  
            map.set(scr_socket_id,cli_socket_id);
            map.set(cli_socket_id,scr_socket_id);
        }

        console.log(map);
        console.log('emitting net details to client------->')
        io.to(socket.id).emit('NETWORK_DETAILS',{net_details:local_network});
            
    })
//=================================================================================================================================


//==================================================================================================================================
// Find all the local devices  (client ----> script)     
    // socket.on('INITIATE_SCAN',({cli_id})=>{
    //     io.to(map.get(cli_id)).emit('SCAN_LOCAL_DEVICES');
    // })
    // socket.on('INITIATE_SCAN',({cli_id})=>{
    //     io.to(map.get(cli_id)).emit('SCAN_LOCAL_DEVICES');
    // })
    // Find all the local devices (client ----> script)     
socket.on('INITIATE_SCAN', (data) => {
    // Ignore data.cli_id, use the actual socket.id of the sender
    const targetScriptId = map.get(socket.id);
    
    console.log(`INITIATE_SCAN received from ${socket.id}. Target script: ${targetScriptId}`);
    
    if (targetScriptId) {
        io.to(targetScriptId).emit('SCAN_LOCAL_DEVICES');
    } else {
        console.log("Error: This client is not paired with a script!");
    }
});
// Sending the results of scan to client  (script -----> client)
    // socket.on('LOCAL_DEVICE_SCANNED_RESULTS',({scr_id,devices})=>{
    //     io.to(map.get(scr_id)).emit('SCAN_RESULTS',{devices:devices});
    // })
    // Inside Relay_server/index.js

// Sending the results of scan to client (script -----> client)
socket.on('LOCAL_DEVICE_SCANNED_RESULTS', ({ scr_id, devices }) => {
    // 1. Find the Client ID paired with this Python Script
    const targetClientId = map.get(socket.id); 

    console.log(`Results received from script ${socket.id}. Forwarding to client ${targetClientId}`);

    if (targetClientId) {
        // 2. MAKE SURE THIS EVENT NAME MATCHES YOUR FRONTEND!
        // If your frontend uses socket.on('SCAN_RESULTS'), keep it as 'SCAN_RESULTS'
        // If your frontend uses socket.on('LOCAL_DEVICE_SCANNED_RESULTS'), change it to that!
        io.to(targetClientId).emit('SCAN_RESULTS', { devices: devices });
    } else {
        console.log("Error: Result received, but no paired client found!");
    }
});
//=================================================================================================================================

    socket.on('disconnect',()=>{
        map.delete(socket.id);
        console.log(map);
    })

})



app.get('/',(req,res)=>{
    res.status(200).end(`<h1>Welcome to the Relay server</h1>`);
})

http_server.listen(PORT,()=>{
    console.log(`app is listening on http://localhost:${PORT}`);
})

