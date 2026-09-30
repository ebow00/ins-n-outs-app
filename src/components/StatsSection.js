import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/config';

export default function StatsSection({ selectedDate, diaryData, weightData }) {
  const themeColors = useThemeColors();

  const styles = StyleSheet.create({
    statsContainer: { backgroundColor: themeColors.card, padding: 16, borderRadius: 12, marginTop: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 10, color: themeColors.title },
    statLine: { fontSize: 14, marginVertical: 3, color: themeColors.text },
    boldText: { fontWeight: 'bold', color: themeColors.title },
  });

  const todaysEntries = diaryData[selectedDate] || [];
  const foodEntries = todaysEntries.filter(e => e.type === 'in');
  const totalCalories = foodEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);

  return (
    <TouchableWithoutFeedback onPress={(e) => e?.stopPropagation?.()}>
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Daily Stats</Text>
        
        <Text style={styles.statLine}>
          Daily Weight:{' '}
          {weightData[selectedDate] && parseFloat(weightData[selectedDate]) > 0 ? (
            <Text style={styles.boldText}>{weightData[selectedDate]} kg</Text>
          ) : (
            <Text style={{ fontStyle: 'italic', color: themeColors.muted }}>No weight entered today</Text>
          )}
        </Text>

        <Text style={styles.statLine}>
          Total Log Entries: <Text style={styles.boldText}>{todaysEntries.length}</Text> (Food: {foodEntries.length}, Outings: {todaysEntries.length - foodEntries.length})
        </Text>

        <Text style={styles.statLine}>
          Total Caloric Intake: <Text style={styles.boldText}>{totalCalories} kcal</Text>
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}