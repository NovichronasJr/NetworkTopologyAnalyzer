"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Reorder, AnimatePresence, useDragControls, motion } from 'framer-motion';
import { GripHorizontal, Terminal, X, Shield, Server, Activity, Cpu, Power } from 'lucide-react';
import { useSocket } from "../../../context/socketContext";
import { useUser } from "../../../context/userContext";
import * as d3 from "d3";

// --- 1. D3 TOPOLOGY COMPONENT ---
// (Keep your TopologyGraph component exactly as it is)
const TopologyGraph = ({ devices, hostIp, onNodeClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!devices || devices.length === 0) return;
    const width = svgRef.current.clientWidth;
    const height = 450;

    const gateway = devices.find(d => d.name === '_gateway') || devices[0];
    
    let nodes = devices.map((d, i) => ({ 
      id: d.ip || i, 
      name: d.name === '_gateway' ? 'Gateway' : (d.name === '?' ? d.ip : d.name),
      isGateway: d.name === '_gateway',
      isHost: d.ip === hostIp 
    }));

    if (hostIp && !nodes.some(n => n.isHost)) {
      nodes.push({
        id: hostIp,
        name: "Scanning Host",
        isGateway: false,
        isHost: true
      });
    }

    const links = nodes
      .filter(n => !n.isGateway)
      .map(n => ({ source: gateway.ip || nodes[0].id, target: n.id }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const container = svg.append("g");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = container.append("g")
      .attr("stroke", "#19d5ff15")
      .attr("stroke-width", 2)
      .selectAll("line").data(links).join("line");

    const node = container.append("g")
      .selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
         if (event.defaultPrevented) return;
         onNodeClick(d.id);
      })
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("title").text(d => `Click to run Deep Scan on ${d.id}`);

    node.filter(d => d.isHost)
      .append("circle")
      .attr("r", 12)
      .attr("fill", "transparent")
      .attr("stroke", "#ff2d55") 
      .attr("stroke-width", 2)
      .append("animate")
      .attr("attributeName", "r")
      .attr("from", "12")
      .attr("to", "24")
      .attr("dur", "1.5s")
      .attr("repeatCount", "indefinite")
      .attr("values", "12; 24; 12");

    node.append("circle")
      .attr("r", d => d.isGateway ? 16 : (d.isHost ? 12 : 10))
      .attr("fill", d => d.isGateway ? "#19d5ff" : (d.isHost ? "#ff2d55" : "#0b1f33"))
      .attr("stroke", d => d.isHost ? "#ff2d55" : "#19d5ff")
      .attr("stroke-width", 2)
      .style("filter", d => d.isHost ? "drop-shadow(0 0 10px #ff2d55)" : "none");

    node.append("text")
      .text(d => d.name)
      .attr("x", 20).attr("y", 5)
      .attr("fill", d => d.isHost ? "#ff2d55" : "#9ca3af")
      .style("font-size", "11px").style("font-family", "monospace").style("font-weight", "bold");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    svg.call(d3.zoom().on("zoom", (e) => container.attr("transform", e.transform)));
  }, [devices, hostIp, onNodeClick]);

  return (
    <div className="w-full h-[450px] bg-[#0b1f33] border-x border-b border-[#19d5ff22] rounded-b-2xl relative overflow-hidden shadow-2xl">
      <div className="absolute bottom-4 right-6 flex gap-4 bg-[#0a1628]/80 backdrop-blur-md p-3 rounded-xl border border-[#19d5ff11] z-10">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#ff2d55] shadow-[0_0_5px_#ff2d55]" />
           <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Scanning Host</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#19d5ff] shadow-[0_0_5px_#19d5ff]" />
           <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Client Node</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

// --- 2. DRAGGABLE SECTION WRAPPER ---
// (Keep your ReorderableSection exactly as it is)
const ReorderableSection = ({ item, children }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="relative flex flex-col mb-6">
      <div onPointerDown={(e) => controls.start(e)} className="w-full bg-[#0a1628] border border-[#19d5ff22] p-4 rounded-t-2xl flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-[#11243d] transition-colors">
        <div className="flex items-center gap-3">
          <GripHorizontal size={18} className="text-[#19d5ff] opacity-40" />
          <span className="text-[10px] font-black text-[#19d5ff] uppercase tracking-[0.2em] italic">
            {item === "table" ? "Node Registry Terminal" : "Topology Visualization Map"}
          </span>
        </div>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[#19d5ff22]" />
            <div className="w-2 h-2 rounded-full bg-[#19d5ff22]" />
        </div>
      </div>
      {children}
    </Reorder.Item>
  );
};

// --- 3. MAIN PAGE COMPONENT ---
export default function Home() {
  const { socket, ip_addr } = useSocket();
  const { userEmail } = useUser() || {};
  const [devices, setDevices] = useState([]);
  const [scan_state, setScan_State] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [items, setItems] = useState(["table", "topology"]);

  // Nmap Deep Scan States
  const [activeNmapIp, setActiveNmapIp] = useState(null);
  const [nmapResults, setNmapResults] = useState(null);
  const [showNmapModal, setShowNmapModal] = useState(false);

  const saveScanToDatabase = async (scannedDevices) => {
    if (!scannedDevices || scannedDevices.length === 0) return;
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
      if (response.ok) setSaveStatus("Results saved successfully!");
      else setSaveStatus("Failed to save results.");
    } catch (err) { setSaveStatus("Network error."); }
  };

  function handleDevices() {
    if (socket && !scan_state) {
      setDevices([]);
      setScanComplete(false);
      setSaveStatus("");
      socket.emit('INITIATE_SCAN', { cli_id: socket.id });
      setScan_State(true);
    }
  }

  // Handle initiating the Deep Scan
  const initiateDeepScan = (ip, e) => {
    if (e) e.stopPropagation();
    
    setActiveNmapIp(ip);
    setNmapResults(null); 
    setShowNmapModal(true);

    if (socket) {
      socket.emit("INITIATE_NMAP_SCAN", { target_ip: ip });
    }
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleScanResults = ({ devices: rcv }) => {
      setDevices(rcv);
      setScan_State(false);
      setScanComplete(true);
      if (rcv && rcv.length > 0) saveScanToDatabase(rcv);
    };

    // --- NEW: Handle real NMAP results from your Python Script ---
    const handleNmapResults = (data) => {
        console.log("Received Nmap Results:", data.results);
        setNmapResults(data.results);
    };

    socket.on('SCAN_RESULTS', handleScanResults);
    socket.on('NMAP_RESULTS', handleNmapResults);
    
    return () => {
      socket.off('SCAN_RESULTS', handleScanResults);
      socket.off('NMAP_RESULTS', handleNmapResults);
    };
  }, [socket, userEmail]);

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-8 pt-24 font-sans selection:bg-[#19d5ff33] relative">
      <div className="max-w-7xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex justify-between items-end mb-12 border-b border-[#19d5ff22] pb-8">
          <div>
            <h1 className="text-5xl font-black text-[#19d5ff] italic tracking-tighter uppercase">Network Explorer</h1>
            <p className="text-gray-400 mt-2 uppercase text-[10px] tracking-[0.2em] font-bold">L3 Local Topology discovery</p>
          </div>
          
          <button
            className={`px-10 py-4 rounded-xl font-black uppercase italic text-sm transition-all duration-300 shadow-[0_0_20px_rgba(25,213,255,0.2)] border ${
              scan_state 
                ? 'bg-[#0a1933] border-[#19d5ff55] cursor-not-allowed text-gray-500' 
                : 'bg-[#19d5ff] text-[#06121f] hover:scale-105 border-transparent'
            }`}
            onClick={handleDevices}
            disabled={scan_state}
          >
            {scan_state ? 'Analyzing...' : scanComplete ? 'Restart Analysis' : 'Start Discovery'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* DRAGGABLE CONTENT AREA */}
          <div className="lg:col-span-3">
            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
              {items.map((item) => (
                <ReorderableSection key={item} item={item}>
                  {item === "table" ? (
                    <div className="bg-[#0b1f33] border-x border-b border-[#19d5ff22] rounded-b-2xl overflow-hidden shadow-2xl">
                      <table className="min-w-full table-auto">
                        <thead className="bg-[#0a1628]/50">
                          <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#19d5ff] uppercase tracking-widest">Device Identity</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#19d5ff] uppercase tracking-widest">IP Address</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[#19d5ff] uppercase tracking-widest">MAC Address</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-[#19d5ff] uppercase tracking-widest">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#19d5ff05]">
                          {devices.length > 0 ? (
                            devices.map((device, index) => (
                              <tr key={index} className="hover:bg-[#19d5ff05] transition-colors group relative">
                                <td className="px-8 py-4 text-sm font-bold">
                                  {device.ip === ip_addr ? (
                                    <span className="flex items-center gap-2 text-[#ff2d55] uppercase italic font-black">
                                      <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse"></span>
                                      System Host
                                    </span>
                                  ) : device.name === '_gateway' ? (
                                    <span className="flex items-center gap-2 text-[#19d5ff] uppercase italic">
                                      <span className="w-2 h-2 rounded-full bg-[#19d5ff] animate-pulse"></span>
                                      Gateway / Hub
                                    </span>
                                  ) : device.name === '?' ? <span className="text-gray-600">Unknown Node</span> : device.name}
                                </td>
                                <td className="px-8 py-4 text-sm font-mono text-gray-400 italic">{device.ip}</td>
                                <td className="px-8 py-4 text-sm font-mono text-gray-500 group-hover:text-gray-300">
                                  {device.mac || '--:--:--:--:--:--'}
                                </td>
                                <td className="px-8 py-4 text-right">
                                  <button 
                                    onClick={(e) => initiateDeepScan(device.ip, e)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#19d5ff11] text-[#19d5ff] hover:bg-[#19d5ff33] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto"
                                  >
                                    <Terminal size={12}/> Deep Scan
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-8 py-24 text-center text-gray-500 italic uppercase text-[10px] tracking-widest">
                                {scan_state ? 'Intercepting packets...' : 'Discovery data inactive. Initialize scan.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {scanComplete && <TopologyGraph devices={devices} hostIp={ip_addr} onNodeClick={initiateDeepScan} />}
                    </AnimatePresence>
                  )}
                </ReorderableSection>
              ))}
            </Reorder.Group>
          </div>

          {/* SIDEBAR SUMMARY */}
          {/* (Keep this sidebar summary exactly as it is) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0b1f33] border border-[#19d5ff22] p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 italic">Discovery Summary</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-6xl font-black text-[#19d5ff] italic tracking-tighter">{devices.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-widest">Active Nodes Found</p>
                </div>
                {ip_addr && (
                  <div className="p-3 bg-[#0a1628] rounded-xl border border-[#ff2d5533]">
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Host Identity</p>
                    <p className="text-[10px] font-mono text-[#ff2d55] font-bold">{ip_addr}</p>
                  </div>
                )}
                <div className="pt-6 border-t border-[#19d5ff11]">
                  <p className="text-xs font-bold text-gray-300 uppercase italic">
                    Status: <span className={scan_state ? 'text-yellow-400' : 'text-green-400'}>
                      {scan_state ? 'In Progress' : scanComplete ? 'Synced' : 'Idle'}
                    </span>
                  </p>
                  {saveStatus && <p className="text-[10px] mt-4 text-[#19d5ff] font-mono tracking-tighter italic">_ {saveStatus}</p>}
                </div>
              </div>
            </div>

            <div className="bg-[#19d5ff05] border border-[#19d5ff11] p-8 rounded-[2rem]">
              <h4 className="text-[10px] font-black text-[#19d5ff] mb-3 uppercase tracking-widest italic">NOC Operations</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                The star topology visualization identifies the local <strong>System Host</strong> in <span className="text-[#ff2d55]">pink</span> to distinguish your device from neighbor nodes centered on the gateway. Hover over table rows or click a graph node to initiate a targeted Nmap scan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- NMAP DEEP SCAN MODAL --- */}
      <AnimatePresence>
        {showNmapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNmapModal(false)}
              className="absolute inset-0 bg-[#06121fbb] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#0b1f33] border border-[#19d5ff33] rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(25,213,255,0.1)] flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#0a1628] border-b border-[#19d5ff22] px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-[#19d5ff11] p-3 rounded-xl border border-[#19d5ff22]">
                    <Shield className="text-[#19d5ff]" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Deep Node Analysis</h2>
                    <p className="text-xs font-mono text-[#19d5ff]">TARGET IP: {activeNmapIp}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNmapModal(false)}
                  className="p-2 bg-[#06121f] text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                {!nmapResults ? (
                  // Loading State
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-6">
                       <Activity size={48} className="text-[#19d5ff] animate-pulse" />
                       <div className="absolute inset-0 border-4 border-[#19d5ff] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg font-bold text-white uppercase tracking-widest mb-2">Engaging Target</p>
                    <p className="text-xs font-mono text-gray-500">Injecting Nmap probes into {activeNmapIp}...<br/>Awaiting ICMP & TCP responses.</p>
                  </div>
                ) : (
                  // Results State
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    
                    {/* Top Overview Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#06121f] border border-[#19d5ff11] p-5 rounded-2xl flex items-center gap-4">
                        <Server className="text-gray-500" size={24}/>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Detected OS / Kernel</p>
                          <p className="text-sm text-[#19d5ff] font-mono mt-1">
                            {/* Dynamically extract the first OS match if it exists */}
                            {nmapResults.os_match && nmapResults.os_match.length > 0 
                              ? `${nmapResults.os_match[0].name} (${nmapResults.os_match[0].accuracy}% sure)` 
                              : "Unknown OS"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#06121f] border border-[#19d5ff11] p-5 rounded-2xl flex items-center gap-4">
                        <Power className="text-gray-500" size={24}/>
                        <div>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Host Status</p>
                          <p className="text-sm text-green-400 font-mono mt-1 uppercase">
                            {nmapResults.status || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Port Table */}
                    <div>
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Cpu size={14}/> Open Port Topography
                      </h3>
                      <div className="border border-[#19d5ff11] rounded-2xl overflow-hidden bg-[#06121f]">
                        <table className="w-full text-left">
                          <thead className="bg-[#0b1f33]/50">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Port</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">State</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Service</th>
                              <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Product & Version</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#19d5ff05]">
                            {/* Dynamically map over your real JSON ports array */}
                            {nmapResults.ports && nmapResults.ports.length > 0 ? (
                              nmapResults.ports.map((port, idx) => (
                                <tr key={idx} className="hover:bg-[#19d5ff05]">
                                  <td className="px-6 py-4 font-mono text-[#19d5ff] text-sm font-bold">
                                    {port.portid} <span className="text-[10px] text-gray-600 font-normal">/{port.protocol}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                                      port.state === 'open' ? 'text-green-400 border-green-400/30 bg-green-400/5' : 'text-yellow-400 border-yellow-400/30'
                                    }`}>
                                      {port.state}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-300 font-bold text-sm">
                                    {port.service}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-400">
                                      {port.product !== "unknown" ? port.product : "-"}
                                    </div>
                                    {port.version !== "unknown" && (
                                      <div className="text-[10px] text-gray-500 font-mono mt-1">v{port.version}</div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-600 text-[10px] uppercase tracking-widest">
                                  No open ports detected.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}