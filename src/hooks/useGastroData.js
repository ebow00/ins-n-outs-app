import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const DIARY_KEY = '@gastro_diary_v2';
const WEIGHT_KEY = '@gastro_weight';

const sortByTime = (entries) => [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Entries saved before ids existed get one on first load
function withIds(diary) {
  let changed = false;
  const next = {};
  for (const [date, entries] of Object.entries(diary)) {
    next[date] = entries.map((entry) => {
      if (entry.id) return entry;
      changed = true;
      return { ...entry, id: createId() };
    });
  }
  return { diary: next, changed };
}

export function useGastroData() {
  const [diaryData, setDiaryData] = useState({});
  const [weightData, setWeightData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs always hold the latest data, so rapid successive updates never build on a stale copy
  const diaryRef = useRef({});
  const weightRef = useRef({});
  const isLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const savedDiary = await AsyncStorage.getItem(DIARY_KEY);
        const savedWeight = await AsyncStorage.getItem(WEIGHT_KEY);
        if (cancelled) return;

        if (savedDiary) {
          const { diary, changed } = withIds(JSON.parse(savedDiary));
          diaryRef.current = diary;
          setDiaryData(diary);
          if (changed) await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(diary));
        }

        if (savedWeight) {
          weightRef.current = JSON.parse(savedWeight);
          setWeightData(weightRef.current);
        }
      } catch {
        Alert.alert("Error", "Failed to load history storage.");
      } finally {
        if (!cancelled) {
          isLoadedRef.current = true;
          setIsLoaded(true);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  const persist = (key, ref, setState, updater, errorMessage) => {
    // Writing before the initial load finishes would overwrite the stored history
    if (!isLoadedRef.current) return;

    const next = updater(ref.current);
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => Alert.alert("Error", errorMessage));
  };

  const updateDiary = (updater) => persist(DIARY_KEY, diaryRef, setDiaryData, updater, "Could not save your changes.");
  const updateWeight = (updater) => persist(WEIGHT_KEY, weightRef, setWeightData, updater, "Could not save your weight.");

  const commitWeight = (date, weightString) => {
    updateWeight((prev) => {
      const next = { ...prev };
      if (weightString === '' || weightString === '.') {
        delete next[date];
      } else {
        const parsedNum = parseFloat(weightString);
        next[date] = !isNaN(parsedNum) ? String(parsedNum) : weightString;
      }
      return next;
    });
  };

  const addLogEntry = (date, entryPayload) => {
    const entry = { ...entryPayload, id: createId() };
    updateDiary((prev) => ({ ...prev, [date]: sortByTime([...(prev[date] || []), entry]) }));
  };

  const editLogEntry = (date, id, entryPayload) => {
    updateDiary((prev) => ({
      ...prev,
      [date]: sortByTime(prev[date].map((entry) => (entry.id === id ? { ...entryPayload, id } : entry)))
    }));
  };

  const deleteLogEntry = (date, id, onDeleted) => {
    Alert.alert("Delete Record", "Are you sure you want to remove this log entry entirely?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          updateDiary((prev) => {
            const next = { ...prev };
            const remaining = prev[date].filter((entry) => entry.id !== id);
            if (remaining.length === 0) delete next[date];
            else next[date] = remaining;
            return next;
          });
          if (onDeleted) onDeleted(id);
        }
      }
    ]);
  };

  return { isLoaded, diaryData, weightData, commitWeight, addLogEntry, editLogEntry, deleteLogEntry };
}
