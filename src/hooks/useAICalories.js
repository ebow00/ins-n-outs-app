import { useState, useRef, useEffect } from 'react';

export function useAICalories() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [foodInputError, setFoodInputError] = useState(null);
  const timersRef = useRef([]);

  // Clean up timers if the component unmounts mid-calculation
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const computeCalories = async (text) => {
    if (!text || text.trim() === '') {
      setFoodInputError(null);
      return { calories: 0, isValid: true };
    }

    setIsCalculating(true);
    setFoodInputError("Calculating...");

    const controller = new AbortController();
    const timer5s = setTimeout(() => setFoodInputError("Thinking..."), 5000);
    const timer10s = setTimeout(() => setFoodInputError("One more moment please..."), 10000);
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    timersRef.current = [timer5s, timer10s, timeoutId];

    try {
      const response = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodText: text }),
        signal: controller.signal
      });

      const data = await response.json();

      if (data.invalid || data.error) {
        setFoodInputError("Invalid input, please enter a real food item.");
        return { calories: 0, isValid: false };
      } else {
        setFoodInputError(null);
        return { calories: data.calories || 0, isValid: true };
      }
    } catch (error) {
      console.error("[Backend Log] API Fetch Error Details:", error.message || error);
      setFoodInputError("Calculation failed - please retry.");
      return { calories: 0, isValid: false };
    } finally {
      setIsCalculating(false);
      clearTimeout(timer5s);
      clearTimeout(timer10s);
      clearTimeout(timeoutId);
    }
  };

  return { computeCalories, isCalculating, foodInputError, setFoodInputError };
}