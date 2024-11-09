// src/components/ShortcutHandler.js
import { useEffect } from 'react';

const ShortcutHandler = () => {
    useEffect(() => {
        const handleKeyPress = (event) => {
            // Check if we're running in Electron
            if (window.electronAPI) {
                // Check for Ctrl+M
                if (event.ctrlKey && event.key === 'm') {
                    event.preventDefault();
                    window.electronAPI.minimizeWindow();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);
    return null;
};

export default ShortcutHandler;