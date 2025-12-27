const io = require('socket.io-client');
const open = require('open');
const {findDevices} = require('./scan')

const socket = io('http://localhost:8001');


console.log("connecting to the relay server");

socket.on('connect', async () => {
    console.log("successfully connected to the server..");
    
    // Use await for reliable browser launching
    await open('http://localhost:3000');

    socket.emit("pair_formation_loc", { loc_id: socket.id });
});

socket.on('SCAN_LOCAL_DEVICES',async()=>{
    const devices = await findDevices();
    socket.emit('LOCAL_DEVICE_SCANNED_RESULTS',{scr_id:socket.id,devices:devices});
    
})

socket.on('connect_error', (err) => {
    console.error("Error connecting to server:", err.message);
});



