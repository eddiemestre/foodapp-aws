import { useEffect, useState } from 'react'

const initBeforeUnload = (showExitPrompt) => {
    window.onbeforeunload = (event) => {
        if (showExitPrompt) {
            const e = event || window.event;
            e.preventDefault();

            if (e) {
                e.returnValue = '';
            }
            return '';
        }
   };
};

// Hook 
export const useExitPrompt = (bool) => {
    const [showExitPrompt, setShowExitPrompt] = useState(bool)
    window.onload = function() {
        initBeforeUnload(showExitPrompt)
    };

    useEffect(() => {
        initBeforeUnload(showExitPrompt)
    }, [showExitPrompt])

    return [showExitPrompt, setShowExitPrompt];
}


