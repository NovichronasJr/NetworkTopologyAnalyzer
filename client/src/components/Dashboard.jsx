// "use client"

// import Image from "next/image"
// import '.././styles/index.css'
// import Link from "next/link"
// import { motion, AnimatePresence } from "framer-motion"
// import { useState } from "react"
// import { useSocket } from "../context/socketContext"
// import { X, Lock, Activity, Shield, Clock, Network } from "lucide-react"

// export default function DashBoard() {
//     const { inf } = useSocket();
//     const [showWarning, setShowWarning] = useState(false);
    
//     // Linux Interface Logic: Matches eth0, enp3s0, eno1, em1, etc.
//     const isEthernetActive = inf && (
//         inf.startsWith("eth") || 
//         inf.startsWith("en") || 
//         inf.startsWith("em")
//     );

//     const handleEthernetClick = (e) => {
//         if (!isEthernetActive) {
//             e.preventDefault();
//             setShowWarning(true);
//         }
//     };

//     return (
//         <div className="w-full min-h-screen bg-[#06121f] text-white p-10 flex flex-col items-center justify-center selection:bg-[#19d5ff33] relative overflow-hidden">
            
//             {/* Background Decorative Glow */}
//             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#19d5ff05] blur-[120px] pointer-events-none" />

//             <motion.div 
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="text-center mb-16 relative z-10"
//             >
//                 <h1 className="text-6xl font-black text-[#19d5ff] italic tracking-tighter uppercase mb-2">
//                     COMMAND CENTER
//                 </h1>
//                 <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">
//                     System Interface: <span className="text-[#19d5ff]">{inf || "DISCONNECTED"}</span>
//                 </p>
//             </motion.div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full relative z-10">
                
//                 {/* User Profile */}
//                 <Link href={'/api/profile'} prefetch={false}>
//                     <motion.div whileHover={{ y: -10 }} className="bg-[#0b1f33] border border-[#19d5ff11] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all h-[350px] shadow-2xl">
//                         <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
//                             <Image src={"/user.png"} width={100} height={100} alt="User Profile" className="opacity-80 group-hover:opacity-100" />
//                         </div>
//                         <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">User Profile</h3>
//                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Access security clearance</p>
//                     </motion.div>
//                 </Link>

//                 {/* Network Scan */}
//                 <Link href={'/api/scan'} prefetch={false}>
//                     <motion.div whileHover={{ y: -10 }} className="bg-[#0b1f33] border border-[#19d5ff11] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all h-[350px] shadow-2xl">
//                         <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
//                             <Image src={"/scan.png"} width={100} height={100} alt="Network Scan" className="opacity-80 group-hover:opacity-100" />
//                         </div>
//                         <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">Network Scan</h3>
//                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">L3 Real-time discovery</p>
//                     </motion.div>
//                 </Link>

//                 {/* Scan History */}
//                 <Link href={'/api/history'} prefetch={false}>
//                     <motion.div whileHover={{ y: -10 }} className="bg-[#0b1f33] border border-[#19d5ff11] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all h-[350px] shadow-2xl">
//                         <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
//                             <Image src={"/history.png"} width={100} height={100} alt="Scan History" className="opacity-80 group-hover:opacity-100" />
//                         </div>
//                         <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">Scan History</h3>
//                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Historical node archives</p>
//                     </motion.div>
//                 </Link>

//                 {/* Ethernet Scan (The "Foggy" Card) */}
//                 <Link href={isEthernetActive ? '/api/ether' : '#'} onClick={handleEthernetClick} prefetch={false}>
//                     <motion.div 
//                         whileHover={isEthernetActive ? { y: -10 } : {}}
//                         className={`p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-[350px] transition-all duration-700 relative overflow-hidden border ${
//                             isEthernetActive 
//                             ? 'bg-[#0b1f33] border-[#19d5ff11] shadow-2xl hover:border-[#19d5ff44]' 
//                             : 'bg-[#0b1f33]/30 border-white/5 cursor-not-allowed group'
//                         }`}
//                     >
//                         {/* The Fog Layer */}
//                         {!isEthernetActive && (
//                             <div className="absolute inset-0 bg-[#06121f]/40 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-6 transition-all group-hover:backdrop-blur-[6px]">
//                                 <Lock className="text-[#19d5ff] opacity-20 mb-2" size={32} />
//                                 <span className="text-[8px] font-black tracking-[0.3em] text-[#19d5ff] opacity-40 uppercase">Restricted Access</span>
//                             </div>
//                         )}

//                         <div className={`mb-6 relative transition-all duration-500 ${!isEthernetActive ? 'grayscale opacity-20 scale-90' : 'group-hover:scale-110'}`}>
//                             <Image src={"/ethernet.png"} width={100} height={100} alt="Ethernet Scan" />
//                         </div>
                        
//                         <h3 className={`text-xl font-black uppercase italic tracking-tighter mb-2 ${!isEthernetActive ? 'text-gray-700' : 'text-white'}`}>
//                             Ethernet Scan
//                         </h3>
//                         <p className={`text-[10px] font-bold uppercase tracking-wider ${!isEthernetActive ? 'text-gray-800' : 'text-gray-500'}`}>
//                             {isEthernetActive ? 'Deep L2 Topology Mapping' : 'Wired Interface Required'}
//                         </p>
//                     </motion.div>
//                 </Link>
//             </div>

//             {/* CUSTOM SYSTEM POPUP */}
//             <AnimatePresence>
//                 {showWarning && (
//                     <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
//                         <motion.div 
//                             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                             onClick={() => setShowWarning(false)}
//                             className="absolute inset-0 bg-[#06121fcc] backdrop-blur-sm" 
//                         />
//                         <motion.div 
//                             initial={{ scale: 0.9, opacity: 0, y: 20 }}
//                             animate={{ scale: 1, opacity: 1, y: 0 }}
//                             exit={{ scale: 0.9, opacity: 0, y: 20 }}
//                             className="bg-[#0b1f33] border border-red-500/30 rounded-[2rem] w-full max-w-md p-10 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center"
//                         >
//                             <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
//                                 <Network className="text-red-500" size={32} />
//                             </div>
//                             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Hardware Link Required</h2>
//                             <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
//                                 This module requires a physical wired connection to perform Layer 2 Bridge MIB analysis. Current interface <span className="text-red-400 font-mono">[{inf || "null"}]</span> does not support this operation.
//                             </p>
//                             <button 
//                                 onClick={() => setShowWarning(false)}
//                                 className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase italic tracking-widest text-xs transition-all border border-white/10"
//                             >
//                                 Acknowledge & Dismiss
//                             </button>
//                         </motion.div>
//                     </div>
//                 )}
//             </AnimatePresence>

//             {/* Bottom Status Bar */}
//             <div className="mt-20 flex gap-8 text-[10px] font-black tracking-[0.2em] text-gray-600 uppercase">
//                 <div className="flex items-center gap-2">
//                     <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
//                     NODE_STABLE
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <div className={`w-1.5 h-1.5 rounded-full ${isEthernetActive ? 'bg-cyan-500' : 'bg-red-500'}`} />
//                     ETH_CARRIER: {isEthernetActive ? 'ACTIVE' : 'OFFLINE'}
//                 </div>
//             </div>
//         </div>
//     )
// }

"use client"

import Image from "next/image"
import '.././styles/index.css'
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useSocket } from "../context/socketContext"
import { X, Lock, Activity, Shield, Clock, Network } from "lucide-react"

export default function DashBoard() {
    const { inf } = useSocket();
    const [showWarning, setShowWarning] = useState(false);
    
    // Linux Interface Logic: eth*, en*, em*
    const isEthernetActive = inf && (
        inf.startsWith("eth") || 
        inf.startsWith("en") || 
        inf.startsWith("em")
    );

    const handleEthernetClick = (e) => {
        if (!isEthernetActive) {
            e.preventDefault();
            setShowWarning(true);
        }
    };

    // Border Styles
    const activeBorder = "border-[#19d5ff33] shadow-[0_0_20px_rgba(25,213,255,0.05)] hover:border-[#19d5ff] hover:shadow-[0_0_30px_rgba(25,213,255,0.2)]";
    const restrictedBorder = "border-white/10 opacity-100"; // Increased visibility for the border even when restricted

    return (
        <div className="w-full min-h-screen bg-[#06121f] text-white p-10 flex flex-col items-center justify-center selection:bg-[#19d5ff33] relative overflow-hidden">
            
            {/* Background Decorative Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#19d5ff05] blur-[120px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16 relative z-10"
            >
                <h1 className="text-6xl font-black text-[#19d5ff] italic tracking-tighter uppercase mb-2">
                    COMMAND CENTER
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                    System Interface: <span className="text-[#19d5ff] font-mono">{inf || "DISCONNECTED"}</span>
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full relative z-10">
                
                {/* User Profile */}
                <Link href={'/api/profile'} prefetch={false}>
                    <motion.div 
                        whileHover={{ y: -10 }} 
                        className={`bg-[#0b1f33] border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all duration-500 h-[350px] shadow-2xl ${activeBorder}`}
                    >
                        <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
                            <Image src={"/user.png"} width={100} height={100} alt="User Profile" className="opacity-80 group-hover:opacity-100" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">User Profile</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Access security clearance</p>
                    </motion.div>
                </Link>

                {/* Network Scan */}
                <Link href={'/api/scan'} prefetch={false}>
                    <motion.div 
                        whileHover={{ y: -10 }} 
                        className={`bg-[#0b1f33] border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all duration-500 h-[350px] shadow-2xl ${activeBorder}`}
                    >
                        <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
                            <Image src={"/scan.png"} width={100} height={100} alt="Network Scan" className="opacity-80 group-hover:opacity-100" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">Network Scan</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">L3 Real-time discovery</p>
                    </motion.div>
                </Link>

                {/* Scan History */}
                <Link href={'/api/history'} prefetch={false}>
                    <motion.div 
                        whileHover={{ y: -10 }} 
                        className={`bg-[#0b1f33] border p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center group transition-all duration-500 h-[350px] shadow-2xl ${activeBorder}`}
                    >
                        <div className="mb-6 relative transition-transform group-hover:scale-110 duration-500">
                            <Image src={"/history.png"} width={100} height={100} alt="Scan History" className="opacity-80 group-hover:opacity-100" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#19d5ff]">Scan History</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Historical node archives</p>
                    </motion.div>
                </Link>

                {/* Ethernet Scan (Recalibrated Fog) */}
                <Link href={isEthernetActive ? '/api/ether' : '#'} onClick={handleEthernetClick} prefetch={false}>
                    <motion.div 
                        whileHover={isEthernetActive ? { y: -10 } : {}}
                        className={`p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-[350px] transition-all duration-700 relative overflow-hidden border ${
                            isEthernetActive 
                            ? `bg-[#0b1f33] shadow-2xl ${activeBorder}` 
                            : `bg-[#0b1f33]/60 cursor-not-allowed group ${restrictedBorder}`
                        }`}
                    >
                        {/* THE RECALIBRATED FOG LAYER */}
                        {!isEthernetActive && (
                            <div className="absolute inset-0 bg-[#06121f]/60 backdrop-blur-[3px] z-20 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#19d5ff11] m-2 rounded-[2rem]">
                                <motion.div 
                                    animate={{ opacity: [0.3, 0.6, 0.3] }} 
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="flex flex-col items-center"
                                >
                                    <Lock className="text-[#19d5ff] mb-3 drop-shadow-[0_0_8px_rgba(25,213,255,0.5)]" size={32} />
                                    <span className="text-[10px] font-black tracking-[0.4em] text-[#19d5ff] uppercase text-center leading-relaxed">
                                        Restricted<br/>Access
                                    </span>
                                </motion.div>
                            </div>
                        )}

                        <div className={`mb-6 relative transition-all duration-500 ${!isEthernetActive ? 'grayscale opacity-30 scale-95 blur-[1px]' : 'group-hover:scale-110'}`}>
                            <Image src={"/ethernet.png"} width={100} height={100} alt="Ethernet Scan" />
                        </div>
                        
                        <h3 className={`text-xl font-black uppercase italic tracking-tighter mb-2 ${!isEthernetActive ? 'text-gray-500' : 'text-white group-hover:text-[#19d5ff]'}`}>
                            Ethernet Scan
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${!isEthernetActive ? 'text-gray-600' : 'text-gray-500'}`}>
                            {isEthernetActive ? 'Deep L2 Topology Mapping' : 'Wired Link Required'}
                        </p>
                    </motion.div>
                </Link>
            </div>

            {/* CUSTOM SYSTEM POPUP - Same Logic */}
            <AnimatePresence>
                {showWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowWarning(false)}
                            className="absolute inset-0 bg-[#06121fdd] backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0b1f33] border border-red-500/30 rounded-[3rem] w-full max-w-md p-10 relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center"
                        >
                            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                                <Network className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Hardware Link Required</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                                System cannot perform L2 analysis on wireless carriers. Please connect via <span className="text-red-400 font-mono">eth/en*</span> interface to proceed.
                            </p>
                            <button 
                                onClick={() => setShowWarning(false)}
                                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105"
                            >
                                System Acknowledge
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Status Bar */}
            <div className="mt-20 flex gap-8 text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    NODE_STABLE
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isEthernetActive ? 'bg-cyan-500 shadow-[0_0_8px_#19d5ff]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                    ETH_CARRIER: {isEthernetActive ? 'ACTIVE' : 'NULL'}
                </div>
            </div>
        </div>
    )
}