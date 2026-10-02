import React, { useState, useRef } from 'react';
import { View, ScrollView, Text, TouchableWithoutFeedback, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { useThemeColors } from '../constants/config';
import { useGastroData } from '../hooks/useGastroData';
import { toLocalDateString } from '../utils/date';
import CalendarSection from '../components/CalendarSection';
import WeightSection from '../components/WeightSection';
import LogSection from '../components/LogSection';
import StatsSection from '../components/StatsSection';

export default function App() {
  const themeColors = useThemeColors();
  const scrollViewRef = useRef(null);
  const logSectionRef = useRef(null);
  
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString());
  const [backgroundPressCount, setBackgroundPressCount] = useState(0);
  const [isLogActive, setIsLogActive] = useState(false); // Track if a log is open/editing

  const { 
    isLoaded,
    diaryData, 
    weightData, 
    commitWeight, 
    addLogEntry, 
    editLogEntry, 
    deleteLogEntry 
  } = useGastroData();

  const handleDateChange = (newDate) => {
    if (isLogActive) {
      // Block date changes across days, weeks, months, or years while a log entry is active
      return;
    }
    setSelectedDate(newDate);
  };

  const scrollToLogSection = () => {
    if (logSectionRef.current && scrollViewRef.current) {
      logSectionRef.current.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current.scrollTo({ y: y - 75, animated: true });
        },
        () => {}
      );
    }
  };

  const scrollToComponentOffset = (nodeRef) => {
    if (nodeRef && scrollViewRef.current && logSectionRef.current) {
      nodeRef.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current.scrollTo({ y: y - 75, animated: true });
        },
        () => {}
      );
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    loadingContainer: { flex: 1, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingTop: 40, paddingHorizontal: 16 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 14, color: themeColors.title },
    scrollFooterSpacer: { height: 60 }
  });

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // Dismissing the keyboard blurs the weight input, which saves it
  const handleBackgroundPress = () => {
    Keyboard.dismiss();
    setBackgroundPressCount(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={{ flexGrow: 1 }}>
            
            <Text style={styles.title}>Gastro Tracker Dashboard</Text>
            
            <CalendarSection 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
            />

            <WeightSection 
              selectedDate={selectedDate} 
              weightData={weightData} 
              commitWeight={commitWeight} 
            />

            <View ref={logSectionRef} collapsable={false}>
              <LogSection 
                selectedDate={selectedDate} 
                diaryData={diaryData} 
                addLogEntry={addLogEntry}
                editLogEntry={editLogEntry}
                deleteLogEntry={deleteLogEntry}
                backgroundPressCount={backgroundPressCount}
                onOpenNewEntry={scrollToLogSection}
                onScrollToItem={scrollToComponentOffset}
                onActiveStateChange={setIsLogActive}
              />
            </View>

            <StatsSection 
              selectedDate={selectedDate} 
              diaryData={diaryData} 
              weightData={weightData} 
            />
            
            <View style={styles.scrollFooterSpacer} />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
}
