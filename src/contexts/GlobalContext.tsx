'use client'

import React, { createContext, useContext, useState } from 'react';

// Create a context with default values
const GlobalContext = createContext<{
    avatar: string | null;
    setAvatar: (avatar: string | null) => void;
}>({
    avatar: null,
    setAvatar: () => { }
});

// Create a provider component
export const GlobalProvider = ({ children, initialAvatar }: { children: React.ReactNode; initialAvatar: string | null }) => {
    const [avatar, setAvatar] = useState<string | null>(initialAvatar);

    return (
        <GlobalContext.Provider value={{ avatar, setAvatar }}>
            {children}
        </GlobalContext.Provider>
    );
};

// Custom hook to use the global context
export const useGlobalContext = () => useContext(GlobalContext);
    
