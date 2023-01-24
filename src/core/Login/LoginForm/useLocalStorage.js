import { useState, useEffect } from "react";


const getLocalValue = (key, initValue) => {
    // SSR Next.js
    if (typeof window === 'undefined') return initValue;

    // if value already stored
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;

    // return result of function
    if (initValue instanceof Function) return initValue();

    return initValue;
}

const useLocalStorage = (key, initValue) => {
    const [value, setValue] = useState(() => {
        return getLocalValue(key, initValue);
    });

    useEffect(() => {
        localStorage.setItem(key, value);
    }, [key, value])

    return [value, setValue]
}

export default useLocalStorage;