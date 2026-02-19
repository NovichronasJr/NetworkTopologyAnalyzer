"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useSocket } from '../../../context/socketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, AlertTriangle, RefreshCw, Layers, Radio, Cpu, Activity 
} from 'lucide-react';
import * as d3 from "d3";

// --- D3 TOPOLOGY COMPONENT ---
const TopologyMap = ({ data, type, loops }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data.nodes || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = 500;
    
    svg.selectAll("*").remove();
    const container = svg.append("g");

    // --- LOGIC: NODE FILTERING ---
    // We must include the "implicit-l2" hub even if it doesn't have a connection_type field
    const nodes = data.nodes
      .filter(n => 
        n.role === "gateway" || 
        n.role === "implicit-l2" || 
        n.connection_type === type
      )
      .map(n => ({ ...n })); 

    const nodeIds = new Set(nodes.map(n => n.id));
    
    // --- LOGIC: EDGE FILTERING ---
    const links = data.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ ...e }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(160))
      .force("charge", d3.forceManyBody().strength(-900))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(45));

    // Links Rendering
    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => {
          const sID = typeof d.source === 'object' ? d.source.id : d.source;
          const tID = typeof d.target === 'object' ? d.target.id : d.target;
          const isLoop = (loops || []).some(loop => loop.includes(sID) && loop.includes(tID));
          return isLoop && type === "ethernet" ? "#ff2d55" : "#19d5ff33";
      })
      .attr("stroke-width", d => {
          const sID = typeof d.source === 'object' ? d.source.id : d.source;
          const tID = typeof d.target === 'object' ? d.target.id : d.target;
          const isLoop = (loops || []).some(loop => loop.includes(sID) && loop.includes(tID));
          return isLoop ? 4 : 2;
      })
      .attr("stroke-dasharray", d => {
          const targetNode = nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
          return targetNode?.inactive ? "5,5" : "0";
      });

    // Node Groups
    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Node Visuals
    node.append("circle")
      .attr("r", d => d.role === "gateway" ? 18 : (d.role === "implicit-l2" ? 15 : 10))
      .attr("fill", d => {
          if (d.inactive) return "#1f2937";
          if (d.role === "gateway") return "#ff7f0e";
          if (d.role === "implicit-l2") return "#2ca02c";
          return "#19d5ff";
      })
      .attr("stroke", "#06121f")
      .attr("stroke-width", 2)
      .style("filter", d => !d.inactive ? "drop-shadow(0 0 10px rgba(25,213,255,0.4))" : "none");

    // Node Labels
    node.append("text")
      .text(d => d.role === "implicit-l2" ? "HUB / L2" : d.id)
      .attr("dy", 32)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("font-weight", "black");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom().on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);

    // --- AUTO-ZOOM CENTER LOGIC ---
    setTimeout(() => {
        const centerNode = nodes.find(n => n.role === "implicit-l2") || nodes.find(n => n.role === "gateway");
        if (centerNode) {
            svg.transition().duration(1000).call(
                zoom.transform,
                d3.zoomIdentity.translate(width / 2 - centerNode.x, height / 2 - centerNode.y).scale(1)
            );
        }
    }, 1200);

  }, [data, type, loops]);

  return (
    <div className="w-full h-[500px] bg-[#0b1f33]/40 border border-[#19d5ff11] rounded-[2.5rem] relative overflow-hidden group shadow-2xl backdrop-blur-sm">
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
            {type === 'ethernet' ? <Layers size={16} className="text-[#19d5ff]" /> : <Radio size={16} className="text-[#19d5ff]" />}
            <span className="text-[10px] font-black text-[#19d5ff] uppercase tracking-[0.3em] italic">
                {type} Fabric Topology
            </span>
        </div>
        <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EtherScan() {
  const { socket } = useSocket();
  const [data, setData] = useState({ nodes: [], edges: [], graph: { real_loops: [] } });
  const [isScanning, setIsScanning] = useState(false);
  
  function handleClick() {
    setIsScanning(true);
    socket.emit("INITIATE_ETH_SCAN");
  }

  useEffect(() => {
    if (socket) {
      // We destructure { devices } once from the server emit
      socket.on('ETH_DEVICES', ({ devices }) => {
        console.log(">>> Raw Data from Server:", devices);

        // If the Python script sent {'devices': ...}, it's now devices.devices
        const actualTopology = devices.devices ? devices.devices : devices;
        
        if (actualTopology && actualTopology.nodes) {
          setData(actualTopology);
          setIsScanning(false); // Stop the loader
          console.log(">>> Topology State Updated Successfully");
        } else {
          console.error(">>> Topology data structure mismatch:", actualTopology);
          setIsScanning(false);
        }
      });
    }
    
    return () => {
      if (socket) socket.off('ETH_DEVICES');
    }
  }, [socket]);

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-10 pt-24 font-sans selection:bg-[#19d5ff33]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-[#19d5ff11] pb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl font-black text-[#19d5ff] italic tracking-tighter uppercase leading-none">Ethernet Analyzer</h1>
            <p className="text-gray-500 font-bold mt-4 uppercase text-[10px] tracking-[0.3em] italic underline decoration-[#19d5ff33]">
              L2 Hub-and-Spoke Intelligence
            </p>
          </motion.div>
          
          <button
            onClick={handleClick}
            disabled={isScanning}
            className={`px-12 py-5 rounded-[1.5rem] font-black uppercase italic text-sm transition-all flex items-center gap-3 border ${
                isScanning 
                ? 'bg-[#0a1933] border-[#19d5ff22] text-gray-500 cursor-wait' 
                : 'bg-[#19d5ff] text-[#06121f] hover:scale-105 shadow-[0_0_30px_rgba(25,213,255,0.3)] border-transparent'
            }`}
          >
            {isScanning ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
            {isScanning ? 'Syncing Map...' : 'Analyze Fabric'}
          </button>
        </div>

        {/* TOPOLOGY VISUALIZATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
            <TopologyMap data={data} type="ethernet" loops={data.graph?.real_loops || []} />
            <TopologyMap data={data} type="wifi" loops={[]} />
        </div>

        {/* REGISTRY TERMINAL */}
        <div className="bg-[#0b1f33] border border-[#19d5ff22] rounded-[3rem] overflow-hidden shadow-2xl mb-20">
            <div className="px-10 py-8 border-b border-[#19d5ff11] bg-[#0a1628]/60 flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-[#19d5ff]">Physical Registry</h3>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase italic"><div className="w-2 h-2 rounded-full bg-[#ff7f0e]"/> Gateway</div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase italic"><div className="w-2 h-2 rounded-full bg-[#2ca02c]"/> Infrastructure</div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-left">
                    <thead className="bg-[#06121f]">
                        <tr>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">Node Address</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">Role</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">MAC Signature</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#19d5ff05]">
                        {data.nodes.map((n, i) => (
                            <tr key={i} className="group hover:bg-[#19d5ff05] transition-colors">
                                <td className="px-10 py-5 font-mono text-sm text-[#19d5ff] font-black italic">{n.id}</td>
                                <td className="px-10 py-5">
                                    <span className="text-[10px] uppercase font-black text-gray-400 italic bg-[#06121f] px-3 py-1 rounded-lg border border-[#19d5ff11]">
                                        {n.role}
                                    </span>
                                </td>
                                <td className="px-10 py-5 font-mono text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                    {n.mac_address || 'VIRTUAL_DEVICE'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  )
}