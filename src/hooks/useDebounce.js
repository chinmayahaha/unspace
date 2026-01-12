/* src/hooks/useDebounce.js */
import { useState, useEffect } from 'react';

// Enterprise Grade: A generic hook usable for Search, Form Validation, or Auto-saving.
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the value after (delay)ms
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay finishes (Cancel the previous search)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}