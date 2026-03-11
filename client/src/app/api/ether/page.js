"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useSocket } from '../../../context/socketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, AlertTriangle, RefreshCw, Layers, Radio, Cpu, Activity 
} from 'lucide-react';
import * as d3 from "d3";

// --- DEVICE TREND LINE GRAPH COMPONENT ---
const DeviceTrendGraph = ({ nodes }) => {
  const [history, setHistory] = useState([]);
  const svgRef = useRef();

  useEffect(() => {
    const activeCount = (nodes || []).filter(n => n.status === 'online').length;
    const now = new Date();
    
    setHistory(prev => {
      if (prev.length > 0 && now.getTime() - prev[prev.length - 1].time.getTime() < 1000) {
        return prev;
      }
      const newHistory = [...prev, { time: now, count: activeCount }];
      return newHistory.slice(-30);
    });
  }, [nodes]);

  useEffect(() => {
    if (!svgRef.current || history.length < 2) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 20, bottom: 20, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(history, d => d.time))
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, Math.max(d3.max(history, d => d.count) + 2, 10)])
      .range([innerHeight, 0]);

    const line = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const area = d3.area()
      .x(d => x(d.time))
      .y0(innerHeight)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "trend-gradient")
      .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#19d5ff").attr("stop-opacity", 0.4);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#19d5ff").attr("stop-opacity", 0);

    g.append("path").datum(history).attr("fill", "url(#trend-gradient)").attr("d", area);
    g.append("path")
      .datum(history)
      .attr("fill", "none")
      .attr("stroke", "#19d5ff")
      .attr("stroke-width", 2)
      .attr("d", line)
      .style("filter", "drop-shadow(0 0 5px rgba(25,213,255,0.5))");

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%H:%M:%S")))
      .attr("color", "#374151")
      .selectAll("text").style("font-size", "9px").attr("fill", "#6b7280");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#374151")
      .selectAll("text").style("font-size", "9px").attr("fill", "#6b7280");

  }, [history]);

  return (
    <div className="w-full h-48 relative">
      {history.length < 2 ? (
        <div className="flex items-center justify-center h-full text-[10px] text-gray-600 uppercase tracking-widest italic animate-pulse">
          Synchronizing Real-time Data...
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      )}
    </div>
  );
};

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

    const nodes = (data.nodes || [])
      .filter(n => 
        n.role === "gateway" || 
        n.role === "implicit-l2" ||
        n.role === "infrastructure" ||
        n.connection_type === type ||
        !n.connection_type 
      )
      .map(n => ({
          ...n,
          id: String(n.id || n.ip),
          role: n.role || "End Device"
      }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = (data.links || [])
      .filter(e => {
        const sID = String(typeof e.source === 'object' ? e.source.id : e.source);
        const tID = String(typeof e.target === 'object' ? e.target.id : e.target);
        return nodeIds.has(sID) && nodeIds.has(tID);
      })
      .map(e => ({ 
        source: String(typeof e.source === 'object' ? e.source.id : e.source),
        target: String(typeof e.target === 'object' ? e.target.id : e.target)
      }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = container.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => {
          const sID = typeof d.source === 'object' ? d.source.id : d.source;
          const tID = typeof d.target === 'object' ? d.target.id : d.target;
          const isLoop = (loops || []).some(loop => loop.includes(sID) && loop.includes(tID));
          return isLoop && type === "ethernet" ? "#ff2d55" : "#19d5ff22";
      })
      .attr("stroke-width", 2);

    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle")
      .attr("r", d => d.role === "gateway" ? 18 : 10)
      .attr("fill", d => d.status === "offline" ? "#1f2937" : (d.role === "gateway" ? "#ff7f0e" : "#19d5ff"))
      .attr("stroke", "#06121f")
      .attr("stroke-width", 2);

    node.append("text")
      .text(d => d.id)
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#9ca3af")
      .style("font-size", "10px")
      .style("font-family", "monospace");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom().on("zoom", (e) => container.attr("transform", e.transform));
    svg.call(zoom);

  }, [data, type, loops]);

  return (
    <div className="w-full h-[500px] bg-[#0b1f33]/40 border border-[#19d5ff11] rounded-[2.5rem] relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
            {type === 'ethernet' ? <Layers size={16} className="text-[#19d5ff]" /> : <Radio size={16} className="text-[#19d5ff]" />}
            <span className="text-[10px] font-black text-[#19d5ff] uppercase tracking-[0.3em] italic">{type} Fabric Topology</span>
        </div>
        <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EtherScan() {
  const { socket } = useSocket();
  const [data, setData] = useState({ nodes: [], links: [], graph: { real_loops: [] } });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('ETH_DEVICES', ({ devices }) => {
        const actual = devices.devices ? devices.devices : devices;
        setData({ nodes: actual.nodes || [], links: actual.links || [], graph: actual.graph || { real_loops: [] } });
        setIsScanning(false);
      });
    }
  }, [socket]);

  const { ipConflicts, realLoops } = useMemo(() => {
    const ipToMacs = new Map();
    data.nodes.forEach(n => {
        if (n.status === 'offline' || !n.mac_address || n.mac_address === "-") return;
        if (!ipToMacs.has(n.id)) ipToMacs.set(n.id, []);
        if (!ipToMacs.get(n.id).includes(n.mac_address)) ipToMacs.get(n.id).push(n.mac_address);
    });
    const conflicts = [];
    ipToMacs.forEach((macs, ip) => { if (macs.length > 1) conflicts.push({ ip, macs }); });
    return { ipConflicts: conflicts, realLoops: data.graph?.real_loops || [] };
  }, [data]);

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-6 md:p-12 pt-24 font-sans selection:bg-[#19d5ff33]">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#19d5ff11] pb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-6xl font-black text-[#19d5ff] italic tracking-tighter uppercase leading-none">Ethernet Analyzer</h1>
            <p className="text-gray-500 font-bold mt-4 uppercase text-[10px] tracking-[0.3em] italic">Full-Spectrum Network Intelligence</p>
          </motion.div>
          
          <button
            onClick={() => { setIsScanning(true); socket.emit("INITIATE_ETH_SCAN"); }}
            disabled={isScanning}
            className="px-12 py-5 rounded-[1.5rem] font-black uppercase italic text-sm transition-all flex items-center gap-3 border bg-[#19d5ff] text-[#06121f] hover:scale-105 shadow-[0_0_30px_rgba(25,213,255,0.3)] border-transparent disabled:opacity-50"
          >
            {isScanning ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
            {isScanning ? 'Syncing...' : 'Analyze Fabric'}
          </button>
        </div>

        {/* TOPOLOGY SECTION (Stacked) */}
        <div className="space-y-8">
            <TopologyMap data={data} type="ethernet" loops={realLoops} />
            <TopologyMap data={data} type="wifi" loops={[]} />
        </div>

        {/* ANALYTICS SECTION (Vertical Stack - Full Width) */}
        <div className="flex flex-col gap-8 w-full">
            
            {/* 1. DEVICE ACTIVITY TREND */}
            <div className="bg-[#0b1f33]/60 border border-[#19d5ff11] rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm w-full">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9ca3af] mb-10 italic">Device Activity Trend</h3>
                <DeviceTrendGraph nodes={data.nodes} />
            </div>

            {/* 2. NETWORK LOOP STATUS */}
            <div className="bg-[#0b1f33]/60 border border-[#19d5ff11] rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm w-full">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff2d55] mb-6 italic">Network Loop Status</h3>
                <div className="space-y-4">
                    {realLoops.length === 0 ? (
                        <div className="flex items-center gap-4 text-gray-500 opacity-40">
                             <Activity size={20}/>
                             <p className="text-[11px] uppercase font-bold tracking-widest">Network Topology Stable: No Active Loops Detected</p>
                        </div>
                    ) : (
                        realLoops.map((loop, idx) => (
                            <div key={idx} className="bg-[#ff2d5508] border border-[#ff2d5522] p-5 rounded-2xl text-xs font-mono text-[#ff2d55] flex items-center gap-3">
                                <AlertTriangle size={16} /> 
                                <span className="font-bold">Loop Conflict:</span> {loop.join(" → ")}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. IP CONFLICT REGISTRY */}
            <div className="bg-[#0b1f33]/60 border border-[#19d5ff11] rounded-[2.5rem] p-8 shadow-xl backdrop-blur-sm w-full">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#19d5ff] mb-6 italic">IP Conflict Registry</h3>
                <div className="space-y-4">
                    {ipConflicts.length === 0 ? (
                        <div className="flex items-center gap-4 text-gray-500 opacity-40">
                            <Cpu size={20} />
                            <p className="text-[11px] uppercase font-bold tracking-widest">Logical Address Registry Clear</p>
                        </div>
                    ) : (
                        ipConflicts.map((c, idx) => (
                            <div key={idx} className="bg-[#19d5ff08] border border-[#19d5ff22] p-5 rounded-2xl text-xs font-mono text-[#19d5ff] flex justify-between items-center">
                                <div>
                                    <span className="font-black underline mr-4">{c.ip}</span>
                                    <span className="text-gray-500 text-[10px]">Conflict across {c.macs.length} physical interfaces</span>
                                </div>
                                <div className="text-[10px] opacity-70 italic">{c.macs.join(" | ")}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* REGISTRY TERMINAL */}
        <div className="bg-[#0b1f33] border border-[#19d5ff22] rounded-[3rem] overflow-hidden shadow-2xl mb-20 w-full">
            <div className="px-10 py-8 border-b border-[#19d5ff11] bg-[#0a1628]/60 flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] italic text-[#19d5ff]">Physical Infrastructure Registry</h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{data.nodes.length} Live Nodes</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="bg-[#06121f]">
                        <tr>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">Node Address</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">Logical Role</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">MAC Signature</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">Metric</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#19d5ff05]">
                        {data.nodes.map((n, i) => (
                            <tr key={i} className="hover:bg-[#19d5ff05] transition-colors group">
                                <td className="px-10 py-5 font-mono text-sm text-[#19d5ff] font-black italic">{n.id}</td>
                                <td className="px-10 py-5 text-[10px] uppercase font-bold text-gray-400">{n.role || 'Peripheral Device'}</td>
                                <td className="px-10 py-5 font-mono text-xs text-gray-600">{n.mac_address}</td>
                                <td className="px-10 py-5 text-right">
                                    <span className={`text-[9px] font-black uppercase italic px-3 py-1 rounded border ${n.status === 'online' ? 'text-[#2ca02c] border-[#2ca02c44]' : 'text-gray-600 border-gray-800'}`}>
                                        {n.status}
                                    </span>
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