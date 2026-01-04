"use client"
import '../styles/index.css'
import { handleLogout } from '../app/auth/actions';
import { useUser } from '../context/userContext';

export default function Navbar() {
  const { userName, clearUser } = useUser() || {};

  const onLogoutClick = async () => {
    // 1. Clear the client-side state immediately
    clearUser(); 
    
    // 2. Call the server action to delete the cookie and redirect
    await handleLogout(); 
  };

  return (
    <nav>
      <span className="brand">Network Topology Visualization System</span>
      {userName && <span className='text-2xl text-orange-400'>{userName}</span>}
      {userName && <button onClick={onLogoutClick}>Logout</button>}
    </nav>
  );
}
