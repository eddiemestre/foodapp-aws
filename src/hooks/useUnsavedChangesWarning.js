import { useEffect, useState } from 'react'

// hook for displaying an alert if there are unsaved changes on a form
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
        // console.log("show exit prompt", showExitPrompt)
        initBeforeUnload(showExitPrompt)
    }, [showExitPrompt])

    return [showExitPrompt, setShowExitPrompt];
}


