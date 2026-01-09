const find = require('local-devices');
const os = require('node:os');

const {wlp3s0} = os.networkInterfaces();  //<--- using os module of the node js to access the cidr information
//                                          from the os..
async function findDevices(){
    console.log("Scanning 192.168.93.1 to 192.168.93.255 ...");
    let devices = [];
    try {
        // devices = await find('192.168.0.0-255'); //<---- uncomment if below line doesnt work
        const cidr = wlp3s0[0].cidr;     //<--- extracting cidr information stored in object.
        devices = await find(cidr);
        console.log("Found devices:", devices);
    } catch (err) {
        console.log("Error:", err);
    }

    return devices;
}

module.exports = {findDevices};