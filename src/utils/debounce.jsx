import { useRef } from "react";

// A simple debounce function
function debounce(fn, ms) {
    let timer;
    return _ => {
        clearTimeout(timer);
        timer = setTimeout(_ => {
            timer = null;
            fn.apply(this, arguments);
        }, ms);
    };
}

export default debounce;

export function useDebouncedCallback(callback, delay) {
    // Use a ref to store the debounced function
    const functionRef = useRef(null);

    if (!functionRef.current) {
        functionRef.current = debounce(callback, delay);
    }

    return functionRef.current;
}