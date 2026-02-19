"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import { useSocket } from "../../../context/socketContext";
import { useUser } from "../../../context/userContext";
import * as d3 from "d3";

// --- 1. D3 TOPOLOGY COMPONENT ---
const TopologyGraph = ({ devices, hostIp }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!devices || devices.length === 0) return;
    const width = svgRef.current.clientWidth;
    const height = 450;

    // Identify Gateway
    const gateway = devices.find(d => d.name === '_gateway') || devices[0];
    
    // Build Node List with Host Logic
    let nodes = devices.map((d, i) => ({ 
      id: d.ip || i, 
      name: d.name === '_gateway' ? 'Gateway' : (d.name === '?' ? d.ip : d.name),
      isGateway: d.name === '_gateway',
      isHost: d.ip === hostIp // Check if this discovered IP is the current user
    }));

    // If the host IP wasn't found in the discovery (common in some Wi-Fi setups), inject it manually
    if (hostIp && !nodes.some(n => n.isHost)) {
      nodes.push({
        id: hostIp,
        name: "Scanning Host",
        isGateway: false,
        isHost: true
      });
    }

    // Links: Every node connects to the gateway (Star Topology)
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
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Host Node Pulse Effect (Behind the node)
    node.filter(d => d.isHost)
      .append("circle")
      .attr("r", 12)
      .attr("fill", "transparent")
      .attr("stroke", "#ff2d55") // Electric Pink for Host
      .attr("stroke-width", 2)
      .append("animate")
      .attr("attributeName", "r")
      .attr("from", "12")
      .attr("to", "24")
      .attr("dur", "1.5s")
      .attr("repeatCount", "indefinite")
      .attr("values", "12; 24; 12");

    // Main Node Circle
    node.append("circle")
      .attr("r", d => d.isGateway ? 16 : (d.isHost ? 12 : 10))
      .attr("fill", d => d.isGateway ? "#19d5ff" : (d.isHost ? "#ff2d55" : "#0b1f33"))
      .attr("stroke", d => d.isHost ? "#ff2d55" : "#19d5ff")
      .attr("stroke-width", 2)
      .style("filter", d => d.isHost ? "drop-shadow(0 0 10px #ff2d55)" : "none");

    // Node Text Labels
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
  }, [devices, hostIp]);

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

  useEffect(() => {
    if (!socket) return;
    const handleScanResults = ({ devices: rcv }) => {
      setDevices(rcv);
      setScan_State(false);
      setScanComplete(true);
      if (rcv && rcv.length > 0) saveScanToDatabase(rcv);
    };
    socket.on('SCAN_RESULTS', handleScanResults);
    return () => socket.off('SCAN_RESULTS', handleScanResults);
  }, [socket, userEmail]);

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-8 pt-24 font-sans selection:bg-[#19d5ff33]">
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#19d5ff05]">
                          {devices.length > 0 ? (
                            devices.map((device, index) => (
                              <tr key={index} className="hover:bg-[#19d5ff05] transition-colors group">
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
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-8 py-24 text-center text-gray-500 italic uppercase text-[10px] tracking-widest">
                                {scan_state ? 'Intercepting packets...' : 'Discovery data inactive. Initialize scan.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {scanComplete && <TopologyGraph devices={devices} hostIp={ip_addr} />}
                    </AnimatePresence>
                  )}
                </ReorderableSection>
              ))}
            </Reorder.Group>
          </div>

          {/* SIDEBAR SUMMARY */}
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
                The star topology visualization identifies the local <strong>System Host</strong> in <span className="text-[#ff2d55]">pink</span> to distinguish your device from neighbor nodes centered on the gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}