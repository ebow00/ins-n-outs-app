import { useState, useRef, useEffect } from 'react';

const TIMEOUT_MS = 30000;

// Space out the loading messages
const LOADING_MESSAGES = [
  [8000, "Thinking..."],
  [16000, "Analyzing ingredients..."],
  [24000, "Almost done..."]
];

const FAILED_RESULT = { calories: 0, ingredients: [], isValid: false };

export function useAICalories() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);
  const timersRef = useRef([]);
  const controllerRef = useRef(null);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const computeCalories = async (text) => {
    if (!text || text.trim() === '') {
      setError(null);
      return { calories: 0, ingredients: [], isValid: true };
    }

    setIsCalculating(true);
    setError(null);
    setStatusMessage("Calculating...");

    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;

    timersRef.current = [
      ...LOADING_MESSAGES.map(([delay, message]) => setTimeout(() => setStatusMessage(message), delay)),
      setTimeout(() => { timedOut = true; controller.abort(); }, TIMEOUT_MS)
    ];

    try {
      const response = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodText: text }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        setError(data.error ? `Calculation failed: ${data.error}` : "Calculation failed - please retry.");
        return FAILED_RESULT;
      }

      if (data.invalid) {
        setError("Invalid input, please enter a real food item.");
        return FAILED_RESULT;
      }

      const ingredientsList = data.ingredients || [];

      // Sum the calories from the ingredients array for the UI display
      const totalCalories = ingredientsList.reduce((sum, item) => sum + (item.calories || 0), 0);

      return {
        calories: totalCalories,
        ingredients: ingredientsList,
        isValid: true
      };
    } catch (err) {
      // Aborted because the form closed, not because of a timeout: nothing to report
      if (err.name === 'AbortError' && !timedOut) return FAILED_RESULT;

      console.error("[Backend Log] API Fetch Error Details:", err.message || err);
      setError(timedOut
        ? "Took too long - please try again."
        : "Couldn't reach the server - check your connection and retry.");
      return FAILED_RESULT;
    } finally {
      clearTimers();
      controllerRef.current = null;
      setIsCalculating(false);
      setStatusMessage(null);
    }
  };

  return { computeCalories, isCalculating, statusMessage, error, clearError: () => setError(null) };
}
