import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '../constants/config';
import LogEntryForm from './LogEntryForm';
import LogItemCard from './LogItemCard';

export default function LogSection({ 
  selectedDate, 
  diaryData, 
  addLogEntry, 
  editLogEntry, 
  deleteLogEntry, 
  backgroundPressCount, 
  onOpenNewEntry, 
  onScrollToItem,
  onActiveStateChange 
}) {
  const themeColors = useThemeColors();
  const itemRefs = useRef({});

  const [showInputBox, setShowInputBox] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [hasUnsavedNewEntry, setHasUnsavedNewEntry] = useState(false);

  useEffect(() => {
    const isActive = showInputBox || editingIndex !== null;
    if (onActiveStateChange) onActiveStateChange(isActive);
  }, [showInputBox, editingIndex]);

  useEffect(() => {
    if (backgroundPressCount > 0 && editingIndex !== null) {
      setEditingIndex(null);
    }
  }, [backgroundPressCount]);

  const triggerEditMode = (index) => {
    if (showInputBox && hasUnsavedNewEntry) {
      Alert.alert(
        "Changes made — keep editing or discard",
        "You have unsaved changes in your new entry.",
        [
          { text: "Keep Editing", style: "cancel" },
          { 
            text: "Discard", 
            style: "destructive", 
            onPress: () => {
              setShowInputBox(false);
              setHasUnsavedNewEntry(false);
              setEditingIndex(index);
              scrollToItem(index);
            } 
          }
        ]
      );
      return;
    }
    
    setShowInputBox(false);
    setEditingIndex(index);
    scrollToItem(index);
  };

  const scrollToItem = (index) => {
    setTimeout(() => {
      if (itemRefs.current[index] && onScrollToItem) {
        onScrollToItem(itemRefs.current[index]);
      }
    }, 50);
  };

  const styles = StyleSheet.create({
    historyContainer: { backgroundColor: themeColors.card, padding: 16, borderRadius: 12, marginVertical: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: themeColors.title },
    addEntrySquareBtn: { backgroundColor: themeColors.primary, width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: themeColors.emptyText, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }
  });

  return (
    <View style={styles.historyContainer}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Daily Log</Text>
        {!showInputBox && (
          <TouchableOpacity 
            style={styles.addEntrySquareBtn} 
            onPress={() => { 
              setEditingIndex(null);
              setShowInputBox(true); 
              if (onOpenNewEntry) onOpenNewEntry();
            }}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {showInputBox && (
        <LogEntryForm 
          mode="add"
          selectedDate={selectedDate}
          onFormDirtyChange={setHasUnsavedNewEntry}
          onSubmit={(payload) => {
            addLogEntry(selectedDate, payload);
            setShowInputBox(false);
            setHasUnsavedNewEntry(false);
          }}
          onCancel={() => {
            setShowInputBox(false);
            setHasUnsavedNewEntry(false);
          }}
        />
      )}

      {diaryData[selectedDate]?.map((item, index) => (
        <View key={index} ref={(el) => (itemRefs.current[index] = el)} collapsable={false}>
          {editingIndex === index ? (
            <LogEntryForm 
              mode="edit"
              initialData={item}
              selectedDate={selectedDate}
              onSubmit={(payload) => {
                editLogEntry(selectedDate, index, payload);
                setEditingIndex(null);
              }}
              onCancel={() => setEditingIndex(null)}
              onDelete={() => deleteLogEntry(selectedDate, index)}
            />
          ) : (
            <LogItemCard 
              item={item} 
              onEdit={() => triggerEditMode(index)} 
              onDelete={() => deleteLogEntry(selectedDate, index)} 
            />
          )}
        </View>
      )) || <Text style={styles.emptyText}>No activities logged for this day.</Text>}
    </View>
  );
}