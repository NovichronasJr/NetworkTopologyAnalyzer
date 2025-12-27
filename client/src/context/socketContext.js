"use client"

import React,{ createContext, useContext,useEffect,useState} from "react";
import {io} from "socket.io-client";

const socketContext = createContext(null);

export const useSocket = ()=>{
    const socket = useContext(socketContext);
    if (socket===undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
      }
      return socket;
}

export const SocketProvider = ({children})=>{
    const [socket,setSocket] = useState(null);

    useEffect(()=>{
        const connection = io('http://localhost:8001');
        setSocket(connection);

        connection.on('connect',()=>{
            console.log('connected to relay server successfully..');
            connection.emit('pair_formation_client',({cli_id:connection.id}))
        })
        connection.on('disconnect',()=>{
            console.log('disconnected from the server..');
        })

        return ()=>{
            connection.disconnect();
        }
    },[])

    return(
    
            <socketContext.Provider value={socket}>
                {children}
            </socketContext.Provider>
    
    )

}
