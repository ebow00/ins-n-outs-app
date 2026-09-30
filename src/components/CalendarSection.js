import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { CalendarProvider, WeekCalendar, Calendar } from 'react-native-calendars';
import { useThemeColors } from '../constants/config';

export default function CalendarSection({ selectedDate, onDateChange }) {
  const themeColors = useThemeColors();
  const [isMonthlyView, setIsMonthlyView] = useState(false);

  const styles = StyleSheet.create({
    calendarWrapper: { backgroundColor: themeColors.card, borderRadius: 12, padding: 10, marginVertical: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, minHeight: 110 },
    toggleCalendarBtn: { backgroundColor: themeColors.secondaryBtn, padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    toggleCalendarBtnText: { color: themeColors.primary, fontWeight: 'bold', fontSize: 14 }
  });

  return (
    <TouchableWithoutFeedback onPress={(e) => e?.stopPropagation?.()}>
      <View style={styles.calendarWrapper}>
        <TouchableOpacity style={styles.toggleCalendarBtn} onPress={() => setIsMonthlyView(!isMonthlyView)}>
          <Text style={styles.toggleCalendarBtnText}>
            {isMonthlyView ? "📅 Switch to Weekly View" : "📅 Switch to Monthly View"}
          </Text>
        </TouchableOpacity>

        <CalendarProvider date={selectedDate} onDateChanged={onDateChange}>
          {isMonthlyView ? (
            <Calendar 
              current={selectedDate}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: themeColors.primary } }}
              theme={{ calendarBackground: themeColors.card, dayTextColor: themeColors.title, textDisabledColor: themeColors.muted, monthTextColor: themeColors.title, todayTextColor: themeColors.primary, arrowColor: themeColors.primary }}
            />
          ) : (
            <WeekCalendar 
              current={selectedDate}
              markedDates={{ [selectedDate]: { selected: true, selectedColor: themeColors.primary } }}
              theme={{ calendarBackground: themeColors.card, dayTextColor: themeColors.title, textDisabledColor: themeColors.muted, monthTextColor: themeColors.title, todayTextColor: themeColors.primary, arrowColor: themeColors.primary }}
            />
          )}
        </CalendarProvider>
      </View>
    </TouchableWithoutFeedback>
  );
}