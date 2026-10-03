import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableWithoutFeedback, StyleSheet, ActivityIndicator, Keyboard, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/config';
import { useGastroData } from '../hooks/useGastroData';
import { toLocalDateString } from '../utils/date';
import CalendarSection from '../components/CalendarSection';
import WeightSection from '../components/WeightSection';
import LogSection from '../components/LogSection';
import SummarySection from '../components/SummarySection';
import AppHeader from '../components/AppHeader';

export default function App() {
  const themeColors = useThemeColors();
  const scrollViewRef = useRef(null);
  const logSectionRef = useRef(null);
  
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString());
  const [backgroundPressCount, setBackgroundPressCount] = useState(0);
  const [isLogActive, setIsLogActive] = useState(false); // Track if a log is open/editing

  // Android leaves an input focused (blinking cursor, and the weight unsaved since it saves on blur)
  // when the keyboard is closed with the back gesture or a tap on a card that handles its own taps.
  // Once the keyboard is really gone, blur whatever input still has focus.
  useEffect(() => {
    let timer = null;
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Keyboard came straight back: focus just moved to another input
        if (Keyboard.isVisible()) return;
        const focused = TextInput.State.currentlyFocusedInput();
        if (focused) TextInput.State.blurTextInput(focused);
      }, 150);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  const { 
    isLoaded,
    diaryData, 
    weightData, 
    periodStarts,
    togglePeriodStart,
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
    scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="In's n Out's Dashboard" onMenuPress={() => {}} />
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={{ flexGrow: 1 }}>
            <CalendarSection 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
              periodStarts={periodStarts}
              onTogglePeriodStart={togglePeriodStart}
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

            <SummarySection 
              selectedDate={selectedDate} 
              diaryData={diaryData} 
              weightData={weightData} 
              periodStarts={periodStarts}
            />
            
            <View style={styles.scrollFooterSpacer} />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
}
