"use client"
import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";

export default function Home() {
  const socket = useSocket();
  const [devices, setDevices] = useState([]);
  const [scan_state,setScan_State] = useState(false);

  function handleDevices() {
    if (socket && devices.length === 0) {
      socket.emit('INITIATE_SCAN', { cli_id: socket.id });
      setScan_State(true);
    }
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ message }) => console.log(message);
    const handleScanResults = ({ devices })=>{
      setDevices(devices)
      setScan_State(false);
    };

    socket.on('message', handleMessage);
    socket.on('SCAN_RESULTS', handleScanResults);

    return () => {
      socket.off('message', handleMessage);
      socket.off('SCAN_RESULTS', handleScanResults);
    }
  }, [socket]);

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-8">

      <div className="flex flex-col items-center gap-6 mt-20">
        <button
          className="w-48 h-16 bg-[#0a1933] text-xl font-bold hover:bg-[#19d5ff55] rounded-lg shadow-lg transition border-[#19d5ff55] border-2"
          onClick={handleDevices}
        >
          {scan_state?'Scanning...':'Start Scan'}
        </button>

        <div className="overflow-x-auto w-full max-w-4xl mt-6">
          <table className="min-w-full table-auto border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-900">
                <th className="border border-gray-600 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-600 px-4 py-2 text-left">IP</th>
                <th className="border border-gray-600 px-4 py-2 text-left">MAC</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, index) => {
                const name = device.name === '_gateway'?'Gateway':device.name==='?'?'Unknown':device.name;
                return (
                  <tr key={device.ip || index} className="bg-gray-800 hover:bg-gray-700 transition">
                    <td className="border border-gray-600 px-4 py-2">{name}</td>
                    <td className="border border-gray-600 px-4 py-2">{device.ip}</td>
                    <td className="border border-gray-600 px-4 py-2">{device.mac || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
