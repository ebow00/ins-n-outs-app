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
    itemIconBadge: { width: 34, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: themeColors.title, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    itemIcon: { width: 24, height: 24, resizeMode: 'contain' },
    timeText: { fontSize: 13, fontWeight: 'bold', color: themeColors.title, marginRight: 8 },
    contentColumn: { flex: 1 },
    historyText: { fontSize: 13, color: themeColors.text },
    detailText: { fontSize: 12, color: themeColors.muted, marginTop: 2 },
    actionButtonContainer: { flexDirection: 'row', alignItems: 'center' },
    actionRowIconBtn: { padding: 8, marginLeft: 4 }
  });

  return (
    <TouchableOpacity 
      style={[styles.historyItemRow, { backgroundColor: cardBg, borderColor: cardBorder }]} 
      onPress={onEdit}
    >
      <View style={styles.rowMeta}>
        <View style={styles.itemIconBadge}>
          <Image source={cardIcon} style={[styles.itemIcon, { tintColor: themeColors.title }]} />
        </View>
        {/* Separate Text so the time stays on the left even when the entry is in Hebrew */}
        <Text style={styles.timeText}>{item.timestamp}</Text>
        <View style={styles.contentColumn}>
          {isFood ? (
            <>
              <Text style={styles.historyText} numberOfLines={1} ellipsizeMode="tail">{item.foodText}</Text>
              <Text style={styles.detailText} numberOfLines={1}>{item.calories || 0} kcal · {item.comment}</Text>
            </>
          ) : (
            <Text style={styles.historyText}>{renderStoolEntryText()}</Text>
          )}
        </View>
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