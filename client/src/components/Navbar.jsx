"use client"
import { useEffect, useState } from 'react';
import '../styles/index.css'
import { handleLogout } from '../app/auth/actions';
import { useUser } from '../context/userContext';
import { useSocket } from '../context/socketContext';

export default function Navbar() {
  const { userName, clearUser } = useUser() || {};
  const { ip_addr, inf } = useSocket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onLogoutClick = async () => {
    clearUser(); 
    await handleLogout(); 
  };

  return (
    <nav className="flex items-center justify-between px-6 py-0 h-[60px] bg-[#0b1f33] border-b-2 border-[#19d5ff55] gap-5">
      <span className="brand text-[#19d5ff] text-[22px] font-semibold">
        Network Topology Visualization System
      </span>
      
      {mounted && (
        <div className="flex items-center gap-4 ml-auto">
          {userName && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse glow-orange"></span>
              <span className="px-3.5 py-1.5 rounded-md text-sm font-medium tracking-wide transition-all duration-300 backdrop-blur-md bg-orange-400/10 border border-orange-400/30 text-orange-400 hover:bg-orange-400/15 glow-box-orange">
                {userName}
              </span>
            </div>
          )}
          
          {(ip_addr || inf) && (
            <div className="flex items-center gap-3 px-4 py-2 bg-green-600/8 rounded-lg border border-green-600/25">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse glow-green"></span>
                <span className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                  Connected
                </span>
              </div>
              
              {inf && (
                <span className="px-3.5 py-1.5 rounded-md text-sm font-medium tracking-wide transition-all duration-300 backdrop-blur-md bg-green-600/10 border border-green-600/30 text-green-600 font-mono hover:bg-green-600/15 border-l border-l-green-600/30 pl-2.5 glow-box-green">
                  {inf}
                </span>
              )}
              
              {ip_addr && (
                <span className="px-3.5 py-1.5 rounded-md text-sm font-medium tracking-wide transition-all duration-300 backdrop-blur-md bg-green-600/10 border border-green-600/30 text-green-600 font-mono hover:bg-green-600/15 border-l border-l-green-600/30 pl-2.5 glow-box-green">
                  {ip_addr}
                </span>
              )}
            </div>
          )}
          
          {userName && (
            <button 
              onClick={onLogoutClick}
              className="px-5 py-2 bg-gradient-to-br from-red-600 to-red-800 text-white border border-red-600/50 rounded-md text-sm font-semibold cursor-pointer transition-all duration-300 hover:from-red-800 hover:to-red-900 hover:-translate-y-0.5 active:translate-y-0 ml-1 glow-box-red"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}