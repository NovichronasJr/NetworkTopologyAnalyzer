"use client"
import { useEffect } from "react";
import { useSocket } from "@/context/socketContext";


export default function Home() {

  const socket = useSocket();
 
  useEffect(()=>{
    
      if(!socket) return;
      console.log("client side ::: ")
      
      
      socket.on('message',({message})=>{
        console.log(message);
      })

      return ()=>{
        socket.off('message',({message})=>{
          console.log(message);
        })
      }
  },[socket])

  return (
  <>
    <div className="w-full h-screen bg-zinc-700">
      <h1>NetTopoVisualizer</h1>
    </div>
  </>
  );
}
