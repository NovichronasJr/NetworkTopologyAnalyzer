"use client"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Server, Shield, X, Save, 
  Activity, Cpu, Network, Zap, Search, Globe, Lock, Play, ChevronRight, Settings, Hash
} from 'lucide-react';
import { useUser } from '../../../../context/userContext';

export default function EthernetConfig() {
  const { userEmail } = useUser() || {};
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewConfig, setReviewConfig] = useState(null); 
  const [editingId, setEditingId] = useState(null);

  const initialFormState = {
    orgName: '',
    targetIps: '', 
    snmpVersion: 'v2c',
    community: 'public',
    username: '',
    authPass: '',
    privPass: '',
    isRecursive: true,
    resolveHostnames: true,
    useLLDP: true,
    useCDP: true
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (userEmail) fetchConfigs();
  }, [userEmail]);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8003/api/ethernet/configs/${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (err) { console.error("Fetch failed", err); }
    finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = `http://localhost:8003/api/ethernet/configs${editingId ? `/${editingId}` : ''}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_email: userEmail })
      });

      if (res.ok) {
        fetchConfigs();
        setIsModalOpen(false);
      }
    } catch (err) { console.error("Save error", err); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      const res = await fetch(`http://localhost:8003/api/ethernet/configs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchConfigs();
    } catch (err) { console.error("Delete failed", err); }
  };

  const handleEditFromReview = () => {
    setEditingId(reviewConfig._id);
    setFormData(reviewConfig);
    setReviewConfig(null);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#06121f] text-white p-10 pt-24 font-sans selection:bg-[#19d5ff33]">
      
      {/* GLOBAL SCROLLBAR KILLER */}
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

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-16 border-b border-[#19d5ff11] pb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black text-[#19d5ff] italic tracking-tighter uppercase">Deployment Profiles</h1>
            <p className="text-gray-500 font-medium mt-2 tracking-wide uppercase text-xs italic italic">Topology Engine Configurator</p>
          </motion.div>
          <button 
            onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}
            className="bg-[#19d5ff] text-[#06121f] px-8 py-4 rounded-2xl font-black uppercase italic text-sm hover:shadow-[0_0_30px_rgba(25,213,255,0.4)] transition-all flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={3} /> New Deployment
          </button>
        </div>

        {/* PROFILE GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center py-40 gap-4">
            <Activity className="animate-spin text-[#19d5ff]" size={40} />
            <span className="text-xs font-mono tracking-[0.3em] text-[#19d5ff]">SYNCING_NODES...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {configs.map((config) => (
              <motion.div 
                whileHover={{ y: -8 }} 
                key={config._id} 
                className="bg-[#0b1f33] border border-[#19d5ff11] rounded-[2.5rem] p-10 hover:border-[#19d5ff55] transition-all group relative cursor-pointer shadow-2xl"
                onClick={() => setReviewConfig(config)}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-[#19d5ff11] rounded-2xl border border-[#19d5ff22]">
                    <Server className="text-[#19d5ff]" size={32} />
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-[#06121f] px-3 py-1 rounded-full border border-[#19d5ff22] text-[10px] font-black text-[#19d5ff]">
                       {config.targetIps ? config.targetIps.split(',').length : 0} SEED NODES
                    </div>
                    <button onClick={(e) => handleDelete(config._id, e)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-6 group-hover:text-[#19d5ff] transition-colors line-clamp-1 italic">
                  {config.orgName}
                </h3>

                <div className="flex gap-4 mb-8">
                  <div className={`h-1.5 w-full rounded-full ${config.isRecursive ? 'bg-[#19d5ff]' : 'bg-gray-800'}`} />
                  <div className={`h-1.5 w-full rounded-full ${config.useLLDP ? 'bg-[#19d5ff]' : 'bg-gray-800'}`} />
                  <div className={`h-1.5 w-full rounded-full ${config.snmpVersion === 'v3' ? 'bg-green-400' : 'bg-yellow-500'}`} />
                </div>

                <div className="flex items-center justify-between text-[#19d5ff] font-black uppercase italic text-[10px] tracking-[0.2em]">
                  <span>Review & Initialize</span>
                  <ChevronRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* --- REVIEW MODAL --- */}
      <AnimatePresence>
        {reviewConfig && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#06121fcc] backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0b1f33] border border-[#19d5ff33] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 force-no-scroll">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Manifest Verification</h2>
                  <button onClick={() => setReviewConfig(null)} className="text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
                </div>

                <div className="bg-[#06121f] rounded-3xl p-8 border border-[#19d5ff11] mb-10 space-y-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Target Seed Devices</p>
                      <div className="flex flex-wrap gap-2 font-mono text-xs">
                        {reviewConfig.targetIps.split(',').map((ip, i) => (
                           <span key={i} className="bg-[#19d5ff11] text-[#19d5ff] border border-[#19d5ff22] px-3 py-1 rounded-md">
                             {ip.trim()}
                           </span>
                        ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-[#19d5ff11]">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase text-gray-400 italic">
                        <Shield size={16} className={reviewConfig.snmpVersion === 'v3' ? 'text-green-400' : 'text-yellow-500'} />
                        Auth: SNMP {reviewConfig.snmpVersion}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold uppercase text-gray-400 italic">
                        <Activity size={16} className={reviewConfig.isRecursive ? 'text-[#19d5ff]' : 'text-gray-600'} />
                        Recursion: ON
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold uppercase text-gray-400 italic">
                        <Network size={16} className={reviewConfig.useLLDP ? 'text-[#19d5ff]' : 'text-gray-600'} />
                        L2 Discovery: LLDP/CDP
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleEditFromReview} className="flex-1 py-5 bg-[#06121f] border border-[#19d5ff22] text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] hover:bg-[#19d5ff11] transition-all">
                    <Settings size={14} className="inline mr-2" /> Modify Parameters
                  </button>
                  <button className="flex-[2] py-5 bg-[#19d5ff] text-[#06121f] rounded-[1.5rem] font-black uppercase italic tracking-widest text-xs shadow-[0_0_30px_rgba(25,213,255,0.3)] hover:scale-[1.02] transition-all">
                    Initialize discovery
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIGURATION MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-[#06121fcc] backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0b1f33] border border-[#19d5ff22] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar force-no-scroll">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-[#19d5ff] uppercase italic tracking-tighter">{editingId ? 'Modify System' : 'New Deployment'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Org Identity</label>
                    <input type="text" className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-2xl px-5 py-3 outline-none focus:border-[#19d5ff] transition-all" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} placeholder="Corporate Data Center" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Anchor IPs (Comma Separated)</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-3.5 text-gray-600" size={18} />
                       <input 
                         type="text" 
                         className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-2xl px-12 py-3 outline-none focus:border-[#19d5ff] font-mono text-xs" 
                         value={formData.targetIps} 
                         onChange={e => setFormData({...formData, targetIps: e.target.value})} 
                         placeholder="192.168.1.1, 10.0.0.1" 
                       />
                    </div>
                  </div>

                  <div className="p-6 bg-[#19d5ff05] border border-[#19d5ff11] rounded-3xl space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#19d5ff] uppercase tracking-widest">Auth Credentials</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer text-gray-400 italic">
                          <input type="radio" checked={formData.snmpVersion === 'v2c'} onChange={() => setFormData({...formData, snmpVersion: 'v2c'})} className="accent-[#19d5ff]" /> V2C
                        </label>
                        <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer text-green-400 italic">
                          <input type="radio" checked={formData.snmpVersion === 'v3'} onChange={() => setFormData({...formData, snmpVersion: 'v3'})} className="accent-[#19d5ff]" /> V3 SECURE
                        </label>
                      </div>
                    </div>
                    {formData.snmpVersion === 'v2c' ? (
                      <input type="text" className="w-full bg-[#06121f] border border-[#19d5ff11] rounded-xl px-5 py-3 outline-none focus:border-[#19d5ff]" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} placeholder="Community String" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="V3 User" className="bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 text-xs" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}/>
                        <input type="password" placeholder="Auth Key" className="bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 text-xs" value={formData.authPass} onChange={e => setFormData({...formData, authPass: e.target.value})}/>
                        <input type="password" placeholder="Priv Key" className="bg-[#06121f] border border-[#19d5ff11] rounded-xl px-4 py-3 text-xs" value={formData.privPass} onChange={e => setFormData({...formData, privPass: e.target.value})}/>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Advanced Scan Options (FIXED WITH onChange) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 italic">Topology Logic</h4>
                      <div className="bg-[#06121f] p-5 rounded-3xl border border-[#19d5ff05] space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">RECURSIVE DISCOVERY</span>
                          <input 
                            type="checkbox" 
                            checked={formData.isRecursive} 
                            onChange={(e) => setFormData({...formData, isRecursive: e.target.checked})}
                            className="accent-[#19d5ff] w-4 h-4 cursor-pointer" 
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">HOSTNAME RESOLUTION</span>
                          <input 
                            type="checkbox" 
                            checked={formData.resolveHostnames} 
                            onChange={(e) => setFormData({...formData, resolveHostnames: e.target.checked})}
                            className="accent-[#19d5ff] w-4 h-4 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 italic">L2 Protocols</h4>
                      <div className="bg-[#06121f] p-5 rounded-3xl border border-[#19d5ff05] space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">LLDP (Standard)</span>
                          <input 
                            type="checkbox" 
                            checked={formData.useLLDP} 
                            onChange={(e) => setFormData({...formData, useLLDP: e.target.checked})}
                            className="accent-[#19d5ff] w-4 h-4 cursor-pointer" 
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">CDP (Cisco)</span>
                          <input 
                            type="checkbox" 
                            checked={formData.useCDP} 
                            onChange={(e) => setFormData({...formData, useCDP: e.target.checked})}
                            className="accent-[#19d5ff] w-4 h-4 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} className="w-full mt-12 py-5 bg-[#19d5ff] text-[#06121f] rounded-[2rem] font-black uppercase italic tracking-widest shadow-[0_0_30px_rgba(25,213,255,0.2)] hover:scale-[1.02] transition-all">
                   Synchronize Deployment Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}