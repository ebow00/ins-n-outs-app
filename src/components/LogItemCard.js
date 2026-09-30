import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '../constants/config';

export default function LogItemCard({ item, onEdit, onDelete }) {
  const themeColors = useThemeColors();
  const isFood = item.type === 'in';
  
  const cardBg = isFood ? themeColors.foodBackground : themeColors.outingBackground;
  const cardBorder = isFood ? themeColors.foodBorder : themeColors.outingBorder;
  const cardIcon = isFood ? require('../../assets/images/healthy-food.png') : require('../../assets/images/toilet.png');

  const renderStoolEntryText = () => {
    const l = item.lowerStool || 4;
    const h = item.higherStool;
    if (h === null || h === undefined || h === l) return `Stool Type ${l}`;
    return `Stool Range: ${Math.min(l, h)} to ${Math.max(l, h)}`;
  };

  const styles = StyleSheet.create({
    historyItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 8, marginVertical: 4 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemIcon: { width: 22, height: 22, marginRight: 10, resizeMode: 'contain' },
    historyText: { fontSize: 13, color: themeColors.text, flex: 1 },
    boldText: { fontWeight: 'bold', color: themeColors.title },
    actionButtonContainer: { flexDirection: 'row', alignItems: 'center' },
    actionRowIconBtn: { padding: 8, marginLeft: 4 }
  });

  return (
    <TouchableOpacity 
      style={[styles.historyItemRow, { backgroundColor: cardBg, borderColor: cardBorder }]} 
      onPress={onEdit}
    >
      <View style={styles.rowMeta}>
        <Image source={cardIcon} style={[styles.itemIcon, { tintColor: themeColors.title }]} />
        <Text style={styles.historyText}>
          <Text style={styles.boldText}>{item.timestamp}</Text> 
          {isFood 
            ? ` — 🍔 "${item.foodText}" (${item.calories || 0} kcal) [${item.comment}]` 
            : ` — 🚽 ${renderStoolEntryText()}`
          }
        </Text>
      </View>
      
      <View style={styles.actionButtonContainer}>
        <View style={styles.actionRowIconBtn}>
          <Pencil size={16} color={themeColors.primary} />
        </View>
        <TouchableOpacity style={styles.actionRowIconBtn} onPress={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 size={16} color={themeColors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}