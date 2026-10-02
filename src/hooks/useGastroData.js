import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedAlert } from '../components/ThemedAlert';

const DIARY_KEY = '@gastro_diary_v2';
const WEIGHT_KEY = '@gastro_weight';
const FOOD_ITEMS_KEY = '@gastro_food_items';
const PERIOD_START_KEY = '@gastro_period_start';

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

const foodItemKey = (name) => name.trim().toLowerCase();

// Upsert AI-returned ingredients into the catalog, keyed by the original (user-language) phrase
function mergeFoodItems(catalog, ingredients) {
  const next = { ...catalog };
  for (const { hebrewName, englishName, calories } of ingredients || []) {
    if (!hebrewName) continue;
    next[foodItemKey(hebrewName)] = {
      originalName: hebrewName.trim(),
      englishName: (englishName || hebrewName).trim(),
      calories: calories || 0,
      updatedAt: new Date().toISOString()
    };
  }
  return next;
}

// Builds the catalog from entries logged before it existed
function catalogFromDiary(diary) {
  return Object.values(diary)
    .flat()
    .reduce((catalog, entry) => mergeFoodItems(catalog, entry.ingredients), {});
}

export function useGastroData() {
  const [diaryData, setDiaryData] = useState({});
  const [weightData, setWeightData] = useState({});
  const [foodItems, setFoodItems] = useState({});
  const [periodStarts, setPeriodStarts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs always hold the latest data, so rapid successive updates never build on a stale copy
  const diaryRef = useRef({});
  const weightRef = useRef({});
  const foodItemsRef = useRef({});
  const periodStartsRef = useRef([]);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const savedDiary = await AsyncStorage.getItem(DIARY_KEY);
        const savedWeight = await AsyncStorage.getItem(WEIGHT_KEY);
        const savedFoodItems = await AsyncStorage.getItem(FOOD_ITEMS_KEY);
        const savedPeriodStart = await AsyncStorage.getItem(PERIOD_START_KEY);
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

        if (savedFoodItems) {
          foodItemsRef.current = JSON.parse(savedFoodItems);
        } else {
          foodItemsRef.current = catalogFromDiary(diaryRef.current);
          await AsyncStorage.setItem(FOOD_ITEMS_KEY, JSON.stringify(foodItemsRef.current));
        }
        setFoodItems(foodItemsRef.current);

        if (savedPeriodStart) {
          const parsed = JSON.parse(savedPeriodStart);
          // Earlier versions stored a single date string
          periodStartsRef.current = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
          setPeriodStarts(periodStartsRef.current);
        }
      } catch {
        ThemedAlert.alert("Error", "Failed to load history storage.");
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
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => ThemedAlert.alert("Error", errorMessage));
  };

  const updateDiary = (updater) => persist(DIARY_KEY, diaryRef, setDiaryData, updater, "Could not save your changes.");
  const updateWeight = (updater) => persist(WEIGHT_KEY, weightRef, setWeightData, updater, "Could not save your weight.");
  const updateFoodItems = (updater) => persist(FOOD_ITEMS_KEY, foodItemsRef, setFoodItems, updater, "Could not save food items.");

  // Marks or clears a YYYY-MM-DD date as a first day of period
  const togglePeriodStart = (date) => persist(PERIOD_START_KEY, periodStartsRef, setPeriodStarts, (prev) =>
    prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
  , "Could not save period start.");

  const recordFoodItems = (entry) => {
    if (entry.type === 'in' && entry.ingredients?.length) {
      updateFoodItems((prev) => mergeFoodItems(prev, entry.ingredients));
    }
  };

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
    recordFoodItems(entry);
  };

  const editLogEntry = (date, id, entryPayload) => {
    updateDiary((prev) => ({
      ...prev,
      [date]: sortByTime(prev[date].map((entry) => (entry.id === id ? { ...entryPayload, id } : entry)))
    }));
    recordFoodItems(entryPayload);
  };

  const deleteLogEntry = (date, id, onDeleted) => {
    ThemedAlert.alert("Delete Record", "Are you sure you want to remove this log entry entirely?", [
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

  return { isLoaded, diaryData, weightData, foodItems, periodStarts, togglePeriodStart, commitWeight, addLogEntry, editLogEntry, deleteLogEntry };
}
