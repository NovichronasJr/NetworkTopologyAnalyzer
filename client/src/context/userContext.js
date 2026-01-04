'use client';
import { createContext, useContext, useState } from 'react';

const UserContext = createContext(undefined);

export default function UserAuthProvider({ children, userName: initialName, userEmail: initialEmail }) {
    const [user, setUser] = useState({ userName: initialName, userEmail: initialEmail });

    const clearUser = () => {
        setUser({ userName: null, userEmail: null });
    };

    return (
        <UserContext.Provider value={{ ...user, clearUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
