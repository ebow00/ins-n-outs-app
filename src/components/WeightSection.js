import React, { useState } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/config';

export default function WeightSection({ selectedDate, weightData, commitWeight }) {
  const themeColors = useThemeColors();
  const storedWeight = weightData[selectedDate] || '';
  const [currentWeightInput, setCurrentWeightInput] = useState(storedWeight);

  // Reset the input when the day or its saved value changes (done during render, not in an effect)
  const syncKey = `${selectedDate}|${storedWeight}`;
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncedKey !== syncKey) {
    setSyncedKey(syncKey);
    setCurrentWeightInput(storedWeight);
  }

  const saveWeightText = (text) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const sections = cleaned.split('.');
    if (sections.length > 2) cleaned = sections[0] + '.' + sections.slice(1).join('');

    const finalParts = cleaned.split('.');
    let integers = finalParts[0] || '';
    let decimals = finalParts[1] !== undefined ? finalParts[1] : null;

    if (integers.length > 3) integers = integers.slice(0, 3);
    if (decimals !== null && decimals.length > 2) decimals = decimals.slice(0, 2);
    if (integers.length > 1 && integers.startsWith('0')) integers = String(parseInt(integers, 10));

    cleaned = decimals !== null ? integers + '.' + decimals : integers;
    setCurrentWeightInput(cleaned);
  };

  const styles = StyleSheet.create({
    weightContainerBox: { backgroundColor: themeColors.card, padding: 14, borderRadius: 12, marginVertical: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    weightBoxTitle: { fontSize: 19, fontWeight: 'bold', color: themeColors.title },
    weightInlineInputRow: { flexDirection: 'row', alignItems: 'center' },
    weightTextInputField: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, width: 80, height: 36, textAlign: 'center', fontSize: 16, fontWeight: '600', color: themeColors.title, backgroundColor: themeColors.inputBg, padding: 4 },
    weightUnitLabelText: { fontSize: 15, fontWeight: '600', color: themeColors.muted, marginLeft: 8 }
  });

  return (
    <TouchableWithoutFeedback onPress={(e) => e?.stopPropagation?.()}>
      <View style={styles.weightContainerBox}>
        <Text style={styles.weightBoxTitle}>Daily Weight</Text>
        <View style={styles.weightInlineInputRow}>
          <TextInput
            style={styles.weightTextInputField}
            value={currentWeightInput}
            onChangeText={saveWeightText}
            onBlur={() => commitWeight(selectedDate, currentWeightInput)}
            onSubmitEditing={() => commitWeight(selectedDate, currentWeightInput)}
            keyboardType="numeric"
            maxLength={6}
            placeholder="--"
            placeholderTextColor={themeColors.muted}
          />
          <Text style={styles.weightUnitLabelText}>kg</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}