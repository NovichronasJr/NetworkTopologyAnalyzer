const find = require('local-devices');

async function findDevices(){
    console.log("Scanning 192.168.93.1 to 192.168.93.255 ...");
    let devices = [];
    try {
        devices = await find('192.168.0.0-255');
        console.log("Found devices:", devices);
    } catch (err) {
        console.log("Error:", err);
    }

    return devices;
}

module.exports = {findDevices};