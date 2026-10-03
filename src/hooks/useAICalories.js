import { useState, useRef, useEffect } from 'react';

import { requestCalories } from '../utils/caloriesApi';
import { logInternal } from '../utils/internalLog';

const TIMEOUT_MS = 30000;

// Space out the loading messages
const LOADING_MESSAGES = [
  [8000, "Thinking..."],
  [16000, "Analyzing ingredients..."],
  [24000, "Almost done..."]
];

const FAILED_RESULT = { calories: 0, ingredients: [], isValid: false };

const GENERIC_ERROR = "Something went wrong, please try again";
const CONNECTION_ERROR = "Can't reach out, please check your connection and try again";

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
    timersRef.current = LOADING_MESSAGES.map(([delay, message]) => setTimeout(() => setStatusMessage(message), delay));

    const startedAt = Date.now();
    try {
      const result = await requestCalories(text, { timeoutMs: TIMEOUT_MS, signal: controller.signal });

      // Aborted because the form closed: nothing to report
      if (result.kind === 'aborted') return FAILED_RESULT;

      if (result.kind !== 'ok') {
        logInternal(`calories_${result.kind}`, { durationMs: Date.now() - startedAt, status: result.status, message: result.message });
        setError(result.kind === 'network' ? CONNECTION_ERROR : GENERIC_ERROR);
        return FAILED_RESULT;
      }

      const { data } = result;
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
    } finally {
      clearTimers();
      controllerRef.current = null;
      setIsCalculating(false);
      setStatusMessage(null);
    }
  };

  return { computeCalories, isCalculating, statusMessage, error, clearError: () => setError(null) };
}
