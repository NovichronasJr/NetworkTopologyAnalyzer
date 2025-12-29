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

io.on('connection',(socket)=>{
    console.log("new socket connected "+socket.id);  
    socket.emit('message',{message:"welcome to the topo"})
    
//==================================================================================================================================
// Forming a pair between client and server 
    socket.on('pair_formation_loc',({loc_id})=>{
        scr_socket_id = loc_id;
        console.log("srcipt :: " + loc_id);
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
            
    })
//=================================================================================================================================


//==================================================================================================================================
// Find all the local devices  (client ----> script)     
    socket.on('INITIATE_SCAN',({cli_id})=>{
        io.to(map.get(cli_id)).emit('SCAN_LOCAL_DEVICES');
    })
// Sending the results of scan to client  (script -----> client)
    socket.on('LOCAL_DEVICE_SCANNED_RESULTS',({scr_id,devices})=>{
        io.to(map.get(scr_id)).emit('SCAN_RESULTS',{devices:devices});
    })
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

