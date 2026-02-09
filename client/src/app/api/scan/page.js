"use client"
import { useEffect, useState } from "react";
import { useSocket } from "../../../context/socketContext";
import { useUser } from "../../../context/userContext"; // Assuming you have user email here

export default function Home() {
  const { socket } = useSocket();
  const { userEmail } = useUser() || {}; // Get the email to identify the scan owner
  const [devices, setDevices] = useState([]);
  const [scan_state, setScan_State] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Function to save scan to database
  const saveScanToDatabase = async (scannedDevices) => {
    if (!scannedDevices || scannedDevices.length === 0) return;
    if (!userEmail) {
        console.error("No user email found for saving scan");
        return;
    }

    try {
      setSaveStatus("Saving results...");
      const response = await fetch(`http://localhost:8003/local_scan/${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ deviceArray: scannedDevices })
      });

      if (response.ok) {
        setSaveStatus("Results saved successfully!");
      } else {
        setSaveStatus("Failed to save results to database.");
      }
    } catch (err) {
      console.error("Database Save Error:", err);
      setSaveStatus("Network error: Could not save scan.");
    }
  };

  function handleDevices() {
    if (socket && !scan_state) {
      // Reset states for a fresh scan
      setDevices([]);
      setScanComplete(false);
      setSaveStatus("");
      
      socket.emit('INITIATE_SCAN', { cli_id: socket.id });
      setScan_State(true);
    }
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ message }) => console.log(message);
    
    const handleScanResults = ({ devices: receivedDevices }) => {
      setDevices(receivedDevices);
      setScan_State(false);
      setScanComplete(true);

      // Only save if we actually found devices
      if (receivedDevices && receivedDevices.length > 0) {
        saveScanToDatabase(receivedDevices);
      }
    };

    socket.on('message', handleMessage);
    socket.on('SCAN_RESULTS', handleScanResults);

    return () => {
      socket.off('message', handleMessage);
      socket.off('SCAN_RESULTS', handleScanResults);
    }
  }, [socket, userEmail]); // Re-run effect if userEmail changes

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10 border-b border-[#19d5ff22] pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#19d5ff]">Network Explorer</h1>
            <p className="text-gray-400 mt-1">Real-time local network topology discovery</p>
          </div>
          
          <button
            className={`px-8 py-3 rounded-md font-bold transition-all duration-300 shadow-[0_0_15px_rgba(25,213,255,0.1)] border ${
              scan_state 
                ? 'bg-[#0a1933] border-[#19d5ff55] cursor-not-allowed text-gray-400' 
                : 'bg-[#19d5ff] text-[#06121f] hover:bg-[#15b8db] border-transparent'
            }`}
            onClick={handleDevices}
            disabled={scan_state}
          >
            {scan_state ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </span>
            ) : scanComplete ? 'Restart Analysis' : 'Start Network Scan'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Table Section */}
          <div className="lg:col-span-3">
            <div className="bg-[#0b1f33] border border-[#19d5ff22] rounded-xl overflow-hidden">
              <table className="min-w-full table-auto">
                <thead className="bg-[#0a1628]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#19d5ff] uppercase tracking-wider">Device Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#19d5ff] uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#19d5ff] uppercase tracking-wider">MAC Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#19d5ff11]">
                  {devices.length > 0 ? (
                    devices.map((device, index) => (
                      <tr key={device.ip || index} className="hover:bg-[#19d5ff05] transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-200">
                          {device.name === '_gateway' ? (
                            <span className="flex items-center gap-2 text-[#19d5ff]">
                              <span className="w-2 h-2 rounded-full bg-[#19d5ff] animate-pulse"></span>
                              Gateway
                            </span>
                          ) : device.name === '?' ? 'Unknown Node' : device.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-400">{device.ip}</td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500 group-hover:text-gray-300">
                          {device.mac || '--:--:--:--:--:--'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-20 text-center text-gray-500 italic">
                        {scan_state ? 'Intercepting packets...' : 'No active discovery data. Initiate scan to begin.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-[#0b1f33] border border-[#19d5ff22] p-6 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Discovery Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-[#19d5ff]">{devices.length}</p>
                  <p className="text-xs text-gray-500 uppercase">Active Nodes Found</p>
                </div>
                <div className="pt-4 border-t border-[#19d5ff11]">
                  <p className="text-sm text-gray-300">
                    Status: <span className={scan_state ? 'text-yellow-400' : 'text-green-400'}>
                      {scan_state ? 'In Progress' : scanComplete ? 'Complete' : 'Idle'}
                    </span>
                  </p>
                  {saveStatus.msg && (
                    <p className={`text-xs mt-2 ${
                      saveStatus.type === 'success' ? 'text-green-500' : 
                      saveStatus.type === 'error' ? 'text-red-400' : 'text-[#19d5ff]'
                    }`}>
                      • {saveStatus.msg}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-[#19d5ff05] border border-[#19d5ff11] p-6 rounded-xl">
              <h4 className="text-xs font-bold text-[#19d5ff] mb-2 uppercase tracking-widest">Network Tip</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nodes marked as "Unknown" are active but didn't respond to NetBIOS or DNS hostname queries. Try checking their IP directly in your management console.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}