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

const PORT = 3001;

const map = new Map();

io.on('connection',(socket)=>{
    let scr_socket_id = "";
    let cli_socket_id = "";
    console.log("new socket connected "+socket.id);  
    socket.emit('message',{message:"welcome to the topo"})
    
    socket.on('pair_formation_loc',({loc_id})=>{
        scr_socket_id = loc_id;
    })
    socket.on('pair_formation_client',({cli_id})=>{
        cli_socket_id = cli_id;

        if(scr_socket_id!==undefined && cli_socket_id!==undefined)
        {  
            map.set(scr_socket_id,cli_socket_id);
            map.set(cli_socket_id,scr_socket_id);
        }

        console.log(map);
            
    })
    


})


app.get('/',(req,res)=>{
    res.status(200).end(`<h1>Welcome to the Relay server</h1>`);
})

http_server.listen(PORT,()=>{
    console.log(`app is listening on http://localhost:${PORT}`);
})

