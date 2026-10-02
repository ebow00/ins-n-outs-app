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
  const [editingId, setEditingId] = useState(null);
  const [hasUnsavedNewEntry, setHasUnsavedNewEntry] = useState(false);

  // A tap on the background closes the edit form (handled during render, not in an effect)
  const [seenPressCount, setSeenPressCount] = useState(backgroundPressCount);
  if (seenPressCount !== backgroundPressCount) {
    setSeenPressCount(backgroundPressCount);
    setEditingId(null);
  }

  useEffect(() => {
    const isActive = showInputBox || editingId !== null;
    if (onActiveStateChange) onActiveStateChange(isActive);
  }, [showInputBox, editingId, onActiveStateChange]);

  const triggerEditMode = (id) => {
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
              setEditingId(id);
              scrollToItem(id);
            }
          }
        ]
      );
      return;
    }

    setShowInputBox(false);
    setEditingId(id);
    scrollToItem(id);
  };

  const scrollToItem = (id) => {
    setTimeout(() => {
      if (itemRefs.current[id] && onScrollToItem) {
        onScrollToItem(itemRefs.current[id]);
      }
    }, 50);
  };

  const handleDelete = (id) => {
    deleteLogEntry(selectedDate, id, (deletedId) => {
      delete itemRefs.current[deletedId];
      setEditingId((current) => (current === deletedId ? null : current));
    });
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
              setEditingId(null);
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

      {diaryData[selectedDate]?.map((item) => (
        <View key={item.id} ref={(el) => (itemRefs.current[item.id] = el)} collapsable={false}>
          {editingId === item.id ? (
            <LogEntryForm
              mode="edit"
              initialData={item}
              selectedDate={selectedDate}
              onSubmit={(payload) => {
                editLogEntry(selectedDate, item.id, payload);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(item.id)}
            />
          ) : (
            <LogItemCard
              item={item}
              onEdit={() => triggerEditMode(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        </View>
      )) || <Text style={styles.emptyText}>No activities logged for this day.</Text>}
    </View>
  );
}
