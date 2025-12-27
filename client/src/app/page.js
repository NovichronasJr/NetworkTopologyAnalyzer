"use client"
import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";

export default function Home() {
  const socket = useSocket();
  const [devices, setDevices] = useState([]);

  function handleDevices() {
    if (socket && devices.length === 0) {
      socket.emit('INITIATE_SCAN', { cli_id: socket.id });
    }
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ message }) => console.log(message);
    const handleScanResults = ({ devices }) => setDevices(devices);

    socket.on('message', handleMessage);
    socket.on('SCAN_RESULTS', handleScanResults);

    return () => {
      socket.off('message', handleMessage);
      socket.off('SCAN_RESULTS', handleScanResults);
    }
  }, [socket]);

  return (
    <div className="w-full min-h-screen bg-zinc-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-amber-400">NetTopoVisualizer</h1>

      <div className="flex flex-col items-center gap-6">
        <button
          className="w-48 h-16 bg-amber-500 text-xl font-bold hover:bg-amber-600 rounded-lg shadow-lg transition"
          onClick={handleDevices}
        >
          {devices.length !== 0 ? "Results" : "Start Scan"}
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
                const name = device.type === 'gateway'
                  ? 'Gateway'
                  : device.name || 'Unknown';
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
