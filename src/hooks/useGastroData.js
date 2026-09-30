import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export function useGastroData() {
  const [diaryData, setDiaryData] = useState({});
  const [weightData, setWeightData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedDiary = await AsyncStorage.getItem('@gastro_diary_v2');
      if (savedDiary) setDiaryData(JSON.parse(savedDiary));
      
      const savedWeight = await AsyncStorage.getItem('@gastro_weight');
      if (savedWeight) setWeightData(JSON.parse(savedWeight));
    } catch (e) {
      Alert.alert("Error", "Failed to load history storage.");
    }
  };

  const saveDiaryData = async (data) => {
    try {
      setDiaryData(data);
      await AsyncStorage.setItem('@gastro_diary_v2', JSON.stringify(data));
    } catch (e) {
      Alert.alert("Error", "Could not save your changes.");
    }
  };

  const commitWeight = async (date, weightString) => {
    const updatedWeight = { ...weightData };
    if (weightString === '' || weightString === '.') {
      delete updatedWeight[date];
    } else {
      let parsedNum = parseFloat(weightString);
      updatedWeight[date] = !isNaN(parsedNum) ? String(parsedNum) : weightString;
    }
    setWeightData(updatedWeight);
    await AsyncStorage.setItem('@gastro_weight', JSON.stringify(updatedWeight));
  };

  const addLogEntry = (date, entryPayload) => {
    const updatedData = { ...diaryData };
    if (!updatedData[date]) updatedData[date] = [];

    updatedData[date].push(entryPayload);
    updatedData[date].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    saveDiaryData(updatedData);
  };

  const editLogEntry = (date, index, entryPayload) => {
    const updatedData = { ...diaryData };
    updatedData[date][index] = entryPayload;
    updatedData[date].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    saveDiaryData(updatedData);
  };

  const deleteLogEntry = (date, index) => {
    Alert.alert("Delete Record", "Are you sure you want to remove this log entry entirely?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedData = { ...diaryData };
          updatedData[date].splice(index, 1);
          if (updatedData[date].length === 0) delete updatedData[date];
          saveDiaryData(updatedData);
        }
      }
    ]);
  };

  return { diaryData, weightData, commitWeight, addLogEntry, editLogEntry, deleteLogEntry };
}