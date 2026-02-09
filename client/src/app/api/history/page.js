"use client"
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../../../context/userContext'

export default function History() {
  const { userEmail } = useUser() || {};
  const [selectedType, setSelectedType] = useState(null); 
  const [expandedScan, setExpandedScan] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [localHistory, setLocalHistory] = useState([]);
  const [ethernetHistory, setEthernetHistory] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (userEmail) fetchHistory();
    
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSelectedType(null);
        setExpandedScan(null);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userEmail]);

  const fetchHistory = async () => {
    try {
      const resLocal = await fetch(`http://localhost:8003/api/history/local/${encodeURIComponent(userEmail)}`);
      const dataLocal = await resLocal.json();
      setLocalHistory(dataLocal);

      const resEth = await fetch(`http://localhost:8003/api/history/ethernet/${encodeURIComponent(userEmail)}`);
      const dataEth = await resEth.json();
      setEthernetHistory(dataEth);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const filteredData = (selectedType === 'local' ? localHistory : ethernetHistory).filter(scan => {
    const searchLower = searchQuery.toLowerCase();
    const matchesDate = new Date(scan.createdAt).toLocaleString().toLowerCase().includes(searchLower);
    const matchesDevice = scan.devices.some(dev => 
      dev.name.toLowerCase().includes(searchLower) || 
      dev.ip.includes(searchLower)
    );
    return matchesDate || matchesDevice;
  });

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-6 pt-20 flex flex-col items-center selection:bg-[#19d5ff33]">
      
      <style jsx global>{`
        .force-no-scroll {
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .force-no-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #19d5ff33;
          border-radius: 10px;
        }
      `}</style>

      <motion.div 
        animate={{ opacity: selectedType ? 0.4 : 1, y: selectedType ? -15 : 0 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl font-black text-[#19d5ff] tracking-tighter uppercase italic">Archive Explorer</h1>
        <p className="text-gray-500 mt-3 font-medium text-lg">Analyze historical network topology snapshots</p>
      </motion.div>

      <div 
        ref={containerRef}
        className={`flex w-full max-w-7xl transition-all duration-1000 ease-in-out ${
        selectedType ? 'flex-col lg:flex-row items-start gap-12' : 'flex-col md:flex-row items-center justify-center gap-10'
      }`}>
        
        {/* Navigation Sidebar */}
        <motion.div 
          layout 
          className={`flex gap-6 z-10 ${selectedType ? 'flex-col w-full lg:w-1/3 border-r border-[#19d5ff11] pr-8' : 'flex-row w-full justify-center'}`}
        >
          {['local', 'ethernet'].map((type) => (
            <motion.div 
              key={type}
              layout
              onClick={() => { setSelectedType(type); setExpandedScan(null); }}
              className={`cursor-pointer p-10 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden ${
                selectedType === type 
                ? 'bg-[#19d5ff] text-[#06121f] border-[#19d5ff] shadow-[0_0_40px_rgba(25,213,255,0.25)]' 
                : 'bg-[#0b1f33] border-[#19d5ff22] hover:border-[#19d5ff88] w-full max-w-md' 
              }`}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    {type === 'local' ? 'Network' : 'Ethernet'}
                </h2>
                
                {/* ACTIVE Badge */}
                <AnimatePresence>
                    {selectedType === type && (
                        <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="bg-[#06121f] text-[#19d5ff] text-[10px] font-black px-3 py-1 rounded-full tracking-[0.2em]"
                        >
                            ACTIVE
                        </motion.span>
                    )}
                </AnimatePresence>
              </div>

              <p className={`text-sm mt-2 font-bold tracking-wide ${selectedType === type ? 'text-[#06121f]/60' : 'text-gray-500'}`}>
                {type === 'local' ? localHistory.length : ethernetHistory.length} SESSIONS RECORDED
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Results Pane */}
        <AnimatePresence>
          {selectedType && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="flex-1 w-full"
            >
              <div className="mb-8 relative group">
                <input 
                  type="text"
                  // Descriptive Placeholder
                  placeholder="Search by Hostname, IP Address, or System Timestamp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b1f33] border-2 border-[#19d5ff11] rounded-2xl py-5 px-14 focus:border-[#19d5ff] outline-none transition-all placeholder:text-gray-600 italic"
                />
                <svg className="w-6 h-6 absolute left-5 top-5 text-gray-500 group-focus-within:text-[#19d5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {filteredData.map((scan) => (
                  <motion.div 
                    layout
                    key={scan._id} 
                    className="bg-[#0b1f33] border border-[#19d5ff11] rounded-[1.5rem] overflow-hidden"
                  >
                    <div 
                      onClick={() => setExpandedScan(expandedScan === scan._id ? null : scan._id)}
                      className="p-7 flex justify-between items-center cursor-pointer hover:bg-[#19d5ff08]"
                    >
                      <div className="flex items-center gap-8">
                        <div className="text-3xl font-black text-[#19d5ff] opacity-30">{scan.devices.length.toString().padStart(2, '0')}</div>
                        <div>
                          <p className="font-extrabold text-xl tracking-tight text-gray-100 italic uppercase">System Snapshot</p>
                          <p className="text-xs text-[#19d5ff] font-mono tracking-widest">{new Date(scan.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: expandedScan === scan._id ? 180 : 0 }}>
                        <svg className="w-6 h-6 text-[#19d5ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {expandedScan === scan._id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: "auto", opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="bg-[#06121f88] border-t border-[#19d5ff11] force-no-scroll"
                        >
                          <div className="p-8">
                            <table className="w-full text-sm text-left">
                              <thead className="text-[#19d5ff] font-black text-[10px] tracking-[0.2em] border-b border-[#19d5ff22]">
                                <tr>
                                  <th className="pb-4">HOST IDENTITY</th>
                                  <th className="pb-4">IPV4 ADDRESS</th>
                                  <th className="pb-4 text-right">MAC SIGNATURE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scan.devices.map((dev, i) => (
                                  <tr key={i} className="border-b border-[#ffffff03] last:border-0 hover:bg-[#19d5ff05]">
                                    <td className="py-4 text-gray-300 font-semibold">{dev.name}</td>
                                    <td className="py-4 font-mono text-[#19d5ff]">{dev.ip}</td>
                                    <td className="py-4 font-mono text-right text-gray-500">{dev.mac}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}