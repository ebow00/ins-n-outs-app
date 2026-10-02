import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Plus, Minus, Flame } from 'lucide-react-native';
import { BathroomScaleIcon, PeriodCalendarIcon } from './StatIcons';
import { useThemeColors } from '../constants/config';
import { toLocalDateString, daysInclusive } from '../utils/date';

export default function SummarySection({ selectedDate, diaryData, weightData, periodStarts = [] }) {
  const themeColors = useThemeColors();
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpanded = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const styles = StyleSheet.create({
    summaryContainer: { backgroundColor: themeColors.card, padding: 16, borderRadius: 12, marginTop: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    sectionTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 10, color: themeColors.title },
    tileRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
    tile: { width: '21%', aspectRatio: 1, borderRadius: 10, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', padding: 4 },
    tileValue: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 3 },
    tileCaption: { fontSize: 10, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)' },
    tileHeading: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, color: '#ffffff' },
    tileCount: { fontSize: 19, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
    boldText: { fontWeight: 'bold', color: themeColors.title },
    subTitle: { fontSize: 17, fontWeight: 'bold', marginTop: 14, marginBottom: 6, color: themeColors.title },
    entryBlock: { borderTopWidth: 1, borderTopColor: themeColors.historyRowBorder, paddingVertical: 8 },
    entryRow: { flexDirection: 'row', alignItems: 'center' },
    entryTime: { fontSize: 14, fontWeight: 'bold', color: themeColors.title, width: 52 },
    entryText: { fontSize: 14, fontWeight: '500', color: themeColors.title, flex: 1, marginRight: 8 },
    entryKcal: { fontSize: 14, fontWeight: '700', color: themeColors.title, marginRight: 8 },
    expandBtn: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: themeColors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.secondaryBtn },
    itemsList: { marginTop: 6, marginLeft: 52, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: themeColors.foodBorder },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    itemName: { fontSize: 14, fontWeight: '500', color: themeColors.title, flex: 1, marginRight: 8, textAlign: 'auto' },
    itemKcal: { fontSize: 14, fontWeight: '500', color: themeColors.title },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: themeColors.historyRowBorder, marginTop: 4, paddingTop: 4 },
    emptyItems: { fontSize: 13, fontWeight: '500', fontStyle: 'italic', color: themeColors.muted }
  });

  const todaysEntries = diaryData[selectedDate] || [];
  const foodEntries = todaysEntries.filter(e => e.type === 'in');
  const totalCalories = foodEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const weight = weightData[selectedDate];
  const hasWeight = !!weight && parseFloat(weight) > 0;

  // Counts back from today to the most recent marked first day (future marks are ignored)
  const today = toLocalDateString();
  const latestStart = periodStarts.filter((d) => d <= today).at(-1);
  const periodDays = latestStart ? daysInclusive(latestStart, today) : null;

  return (
    <TouchableWithoutFeedback onPress={(e) => e?.stopPropagation?.()}>
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Daily Summary</Text>

        <View style={styles.tileRow}>
          <View style={styles.tile} accessibilityLabel={`Weight: ${hasWeight ? `${weight} kg` : 'not entered'}`}>
            <BathroomScaleIcon size={20} color="#ffffff" />
            <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{hasWeight ? weight : '--'}</Text>
            <Text style={styles.tileCaption}>kg</Text>
          </View>
          <View style={styles.tile} accessibilityLabel={`Calories: ${totalCalories} kcal`}>
            <Flame size={20} color="#ffffff" />
            <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{totalCalories}</Text>
            <Text style={styles.tileCaption}>kcal</Text>
          </View>
          <View style={styles.tile} accessibilityLabel={`Period days so far: ${periodDays > 0 ? periodDays : 'none'}`}>
            <PeriodCalendarIcon size={20} color="#ffffff" />
            <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{periodDays > 0 ? periodDays : '--'}</Text>
            <Text style={styles.tileCaption}>{periodDays === 1 ? 'day' : 'days'}</Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          <View style={styles.tile}>
            <Text style={styles.tileHeading}>TOTAL</Text>
            <Text style={styles.tileCount}>{todaysEntries.length}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileHeading}>INS</Text>
            <Text style={styles.tileCount}>{foodEntries.length}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileHeading}>OUTS</Text>
            <Text style={styles.tileCount}>{todaysEntries.length - foodEntries.length}</Text>
          </View>
        </View>

        {foodEntries.length > 0 && <Text style={styles.subTitle}>Food Intake Breakdown</Text>}

        {foodEntries.map((entry) => {
          const isExpanded = !!expandedIds[entry.id];
          const items = entry.ingredients || [];
          const ExpandIcon = isExpanded ? Minus : Plus;

          return (
            <View key={entry.id} style={styles.entryBlock}>
              <View style={styles.entryRow}>
                <Text style={styles.entryTime}>{entry.timestamp}</Text>
                <Text style={styles.entryText} numberOfLines={1}>{entry.foodText}</Text>
                <Text style={styles.entryKcal}>{entry.calories || 0} kcal</Text>
                <TouchableOpacity style={styles.expandBtn} onPress={() => toggleExpanded(entry.id)} hitSlop={8}>
                  <ExpandIcon size={14} color={themeColors.primary} />
                </TouchableOpacity>
              </View>

              {isExpanded && (
                <View style={styles.itemsList}>
                  {items.length === 0 ? (
                    <Text style={styles.emptyItems}>No item breakdown for this entry.</Text>
                  ) : (
                    items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.hebrewName || item.englishName}</Text>
                        <Text style={styles.itemKcal}>{item.calories || 0} kcal</Text>
                      </View>
                    ))
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.boldText}>Total</Text>
                    <Text style={styles.boldText}>{items.reduce((sum, item) => sum + (item.calories || 0), 0)} kcal</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </TouchableWithoutFeedback>
  );
}
