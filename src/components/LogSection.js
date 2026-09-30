import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image, TextInput, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Trash2, Pencil, CircleX, Plus } from 'lucide-react-native';
import { useThemeColors, BRISTOL_TYPES, FOOD_COMMENTS } from '../constants/config';

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
  const bristolNumbersArray = Array.from({ length: 7 }, (_, i) => i + 1);

  const foodInputRef = useRef(null);
  const editFoodInputRef = useRef(null);
  const itemRefs = useRef({});

  const [showInputBox, setShowInputBox] = useState(false);
  const [inputTimeObject, setInputTimeObject] = useState(new Date());
  const [showAddPicker, setShowAddPicker] = useState(false);
  
  const [entryType, setEntryType] = useState('in');

  const [foodText, setFoodText] = useState('');
  const [foodCalories, setFoodCalories] = useState(0);
  const [foodCommentChoice, setFoodCommentChoice] = useState(FOOD_COMMENTS[0]);
  const [customComment, setCustomComment] = useState('');
  const [showFoodCommentDropdown, setShowFoodCommentDropdown] = useState(false);

  const [lowerStool, setLowerStool] = useState(4);
  const [higherStool, setHigherStool] = useState(null);
  const [showLowerDropdown, setShowLowerDropdown] = useState(false);
  const [showHigherDropdown, setShowHigherDropdown] = useState(false);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editTimeObject, setEditTimeObject] = useState(new Date());
  const [showEditPicker, setShowEditPicker] = useState(false);
  const [editEntryType, setEditEntryType] = useState('in');
  const [editFoodText, setEditFoodText] = useState('');
  const [editFoodCalories, setEditFoodCalories] = useState(0);
  const [editFoodComment, setEditFoodComment] = useState(FOOD_COMMENTS[0]);
  const [editCustomComment, setEditCustomComment] = useState('');
  const [showEditFoodDropdown, setShowEditFoodDropdown] = useState(false);
  const [editLowerStool, setEditLowerStool] = useState(4);
  const [editHigherStool, setEditHigherStool] = useState(null);
  const [showEditLowerDropdown, setShowEditLowerDropdown] = useState(false);
  const [showEditHigherDropdown, setShowEditHigherDropdown] = useState(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [foodInputError, setFoodInputError] = useState(null);

  useEffect(() => {
    const isActive = showInputBox || editingIndex !== null;
    if (onActiveStateChange) {
      onActiveStateChange(isActive);
    }
  }, [showInputBox, editingIndex]);

  const computeCaloriesWithAI = async (text, isEdit = false) => {
    if (!text || text.trim() === '') {
      isEdit ? setEditFoodCalories(0) : setFoodCalories(0);
      setFoodInputError(null);
      return;
    }

    setIsCalculating(true);
    // State 1: Immediate feedback upon leaving the text box
    setFoodInputError("Calculating...");

    const controller = new AbortController();

    // State 2 & 3: Progressive messaging at 5s and 10s
    const timer5s = setTimeout(() => setFoodInputError("Thinking..."), 5000);
    const timer10s = setTimeout(() => setFoodInputError("One more moment please..."), 10000);
    
    // State 4: Hard abort at 15 seconds
    const timeoutId = setTimeout(() => controller.abort(), 15000); 

    try {
      const response = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodText: text }),
        signal: controller.signal
      });

      const data = await response.json();

      if (data.invalid || data.error) {
        isEdit ? setEditFoodCalories(0) : setFoodCalories(0);
        setFoodInputError("Invalid input, please enter a real food item.");
      } else {
        isEdit ? setEditFoodCalories(data.calories || 0) : setFoodCalories(data.calories || 0);
        setFoodInputError(null); // Clear the status message on success
      }
    } catch (error) {
      // The developer sees the technical details in the terminal
      console.error("[Backend Log] API Fetch Error Details:", error.message || error);
      
      // The user sees the clean failure message
      setFoodInputError("Calculation failed - please retry.");
      isEdit ? setEditFoodCalories(0) : setFoodCalories(0);
    } finally {
      setIsCalculating(false);
      // Crucial: Clear all pending timers the moment a response (or error) resolves
      clearTimeout(timer5s);
      clearTimeout(timer10s);
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    const handleKeyboardHide = () => {
      if (showInputBox && entryType === 'in') {
        computeCaloriesWithAI(foodText, false);
      }
      if (editingIndex !== null && editEntryType === 'in') {
        computeCaloriesWithAI(editFoodText, true);
      }
    };

    const subscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => subscription.remove();
  }, [showInputBox, entryType, foodText, editingIndex, editEntryType, editFoodText]);

  useEffect(() => {
    if (backgroundPressCount > 0 && editingIndex !== null) {
      setEditingIndex(null);
      setShowEditFoodDropdown(false);
      setShowEditLowerDropdown(false);
      setShowEditHigherDropdown(false);
    }
  }, [backgroundPressCount]);

  const formatTimeToString = (dateObj) => dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleContainerPress = () => {
    if (foodInputRef.current) foodInputRef.current.blur();
    if (editFoodInputRef.current) editFoodInputRef.current.blur();
    Keyboard.dismiss();
  };

  const resetFormState = () => {
    setFoodText('');
    setFoodCalories(0);
    setFoodInputError(null);
    setFoodCommentChoice(FOOD_COMMENTS[0]);
    setCustomComment('');
    setLowerStool(4);
    setHigherStool(null);
    setEntryType('in');
    setShowFoodCommentDropdown(false);
    setShowLowerDropdown(false);
    setShowHigherDropdown(false);
  };

  const handleCancel = () => {
    handleContainerPress();
    resetFormState();
    setShowInputBox(false);
  };

  const getAllowedHigherValues = (lowerVal) => {
    let allowed = [lowerVal];
    if (lowerVal > 1) allowed.push(lowerVal - 1);
    if (lowerVal < 7) allowed.push(lowerVal + 1);
    return allowed.sort((a, b) => a - b);
  };

  const handleLowerStoolChange = (val) => {
    setLowerStool(val);
    const validHigher = getAllowedHigherValues(val);
    if (higherStool !== null && !validHigher.includes(higherStool)) {
      setHigherStool(null);
    }
    setShowLowerDropdown(false);
  };

  const handleEditLowerStoolChange = (val) => {
    setEditLowerStool(val);
    const validHigher = getAllowedHigherValues(val);
    if (editHigherStool !== null && !validHigher.includes(editHigherStool)) {
      setEditHigherStool(null);
    }
    setShowEditLowerDropdown(false);
  };

  const isAddDisabled = entryType === 'in' && (!foodText || foodText.trim() === '' || isCalculating || foodInputError !== null);
  const isEditDisabled = editEntryType === 'in' && (!editFoodText || editFoodText.trim() === '' || isCalculating || foodInputError !== null);

  const handleAdd = () => {
    if (isAddDisabled) return;
    handleContainerPress();
    const timestamp = formatTimeToString(inputTimeObject);
    let payload = { timestamp, type: entryType };

    if (entryType === 'in') {
      const commentFinal = foodCommentChoice === 'Other...' ? customComment : foodCommentChoice;
      payload.foodText = foodText;
      payload.calories = foodCalories;
      payload.comment = commentFinal;
    } else {
      payload.lowerStool = lowerStool;
      payload.higherStool = higherStool;
    }

    addLogEntry(selectedDate, payload);
    setShowInputBox(false);
    resetFormState();
  };

  const handleEditSave = (index) => {
    if (isEditDisabled) return;
    handleContainerPress();
    const timestamp = formatTimeToString(editTimeObject);
    let payload = { timestamp, type: editEntryType };

    if (editEntryType === 'in') {
      const commentFinal = editFoodComment === 'Other...' ? editCustomComment : editFoodComment;
      payload.foodText = editFoodText;
      payload.calories = editFoodCalories;
      payload.comment = commentFinal;
    } else {
      payload.lowerStool = editLowerStool;
      payload.higherStool = editHigherStool;
    }

    editLogEntry(selectedDate, index, payload);
    setEditingIndex(null);
  };

  const executeTriggerEditMode = (item, index) => {
    setEditingIndex(index);
    setEditEntryType(item.type || 'in');
    
    const dummyDate = new Date();
    const parts = item.timestamp.split(':');
    dummyDate.setHours(parseInt(parts.at(0), 10));
    dummyDate.setMinutes(parseInt(parts.at(1), 10));
    setEditTimeObject(dummyDate);

    if (item.type === 'in') {
      setEditFoodText(item.foodText || '');
      setEditFoodCalories(item.calories || 0);
      setFoodInputError(null);
      if (FOOD_COMMENTS.includes(item.comment)) {
        setEditFoodComment(item.comment);
        setEditCustomComment('');
      } else {
        setEditFoodComment('Other...');
        setEditCustomComment(item.comment || '');
      }
    } else {
      setEditLowerStool(item.lowerStool || 4);
      setEditHigherStool(item.higherStool !== undefined ? item.higherStool : null);
    }

    setTimeout(() => {
      if (itemRefs.current[index] && onScrollToItem) {
        onScrollToItem(itemRefs.current[index]);
      }
    }, 50);
  };

  const triggerEditMode = (item, index) => {
    if (showInputBox) {
      const hasContent = (entryType === 'in' && foodText && foodText.trim() !== '') || 
                         (entryType === 'out' && (lowerStool !== 4 || higherStool !== null));

      if (hasContent) {
        Alert.alert(
          "Changes made — keep editing or discard",
          "You have unsaved changes in your new entry.",
          [
            { text: "Keep Editing", style: "cancel", onPress: () => {} },
            { 
              text: "Discard", 
              style: "destructive", 
              onPress: () => {
                setShowInputBox(false);
                resetFormState();
                executeTriggerEditMode(item, index);
              } 
            }
          ]
        );
        return;
      } else {
        setShowInputBox(false);
        resetFormState();
      }
    }

    executeTriggerEditMode(item, index);
  };

  const renderStoolEntryText = (item) => {
    const l = item.lowerStool || 4;
    const h = item.higherStool;

    if (h === null || h === undefined || h === l) {
      return `Stool Type ${l}`;
    }

    const lowVal = Math.min(l, h);
    const highVal = Math.max(l, h);
    return `Stool Range: ${lowVal} to ${highVal}`;
  };

  const styles = StyleSheet.create({
    historyContainer: { backgroundColor: themeColors.card, padding: 16, borderRadius: 12, marginVertical: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: themeColors.title },
    addEntrySquareBtn: { backgroundColor: themeColors.primary, width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    inputContainer: { backgroundColor: themeColors.inputBg, padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: themeColors.border },
    boxTitle: { fontSize: 14, fontWeight: 'bold', color: themeColors.iconMuted, marginBottom: 6 },
    miniLabel: { fontSize: 11, color: themeColors.muted, marginBottom: 2, fontWeight: '600' },
    
    topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    timeBoxWrapper: { alignSelf: 'flex-start' },
    textInputSelector: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: themeColors.inputBg, height: 40, justifyContent: 'center', alignSelf: 'flex-start' },
    selectorTimeText: { fontSize: 14, color: themeColors.title, fontWeight: '500' },
    
    switchRowInline: { flexDirection: 'row', gap: 8 },
    switchButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: themeColors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.secondaryBtn },
    foodSwitchActive: { backgroundColor: themeColors.foodBackground, borderColor: themeColors.foodBorder },
    outingSwitchActive: { backgroundColor: themeColors.outingBackground, borderColor: themeColors.outingBorder },
    switchIcon: { width: 20, height: 20, resizeMode: 'contain' },

    textInputBox: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: themeColors.inputBg, color: themeColors.title, fontSize: 14, height: 70, textAlignVertical: 'top', marginBottom: 10 },
    calculatedBox: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: themeColors.secondaryBtn, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    calculatedText: { fontSize: 13, color: themeColors.text, fontWeight: '600' },
    errorText: { fontSize: 12, color: themeColors.danger, marginBottom: 10, fontWeight: '600' },

    dropdownTrigger: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: themeColors.inputBg, height: 40, justifyContent: 'center', marginBottom: 10 },
    dropdownTriggerText: { fontSize: 13, color: themeColors.text },
    dropdownMenu: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, backgroundColor: themeColors.card, marginBottom: 10, paddingHorizontal: 4 },
    dropdownOption: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: themeColors.dropdownOptionBorder, paddingHorizontal: 6 },
    optionText: { fontSize: 12, color: themeColors.text },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
    addEntryActionBtn: { backgroundColor: themeColors.primary, height: 40, paddingHorizontal: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    disabledActionBtn: { backgroundColor: themeColors.muted, opacity: 0.5 },
    actionAddText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
    cancelLinkBtn: { height: 40, paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: themeColors.border },
    cancelLinkText: { color: themeColors.muted, fontSize: 14 },

    historyItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 8, marginVertical: 4 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemIcon: { width: 22, height: 22, marginRight: 10, resizeMode: 'contain' },
    historyText: { fontSize: 13, color: themeColors.text, flex: 1 },
    boldText: { fontWeight: 'bold', color: themeColors.title },
    actionButtonContainer: { flexDirection: 'row', alignItems: 'center' },
    actionRowIconBtn: { padding: 8, marginLeft: 4 },
    editActionRowControls: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
    iconButton: { padding: 8 },
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
              setInputTimeObject(new Date()); 
              resetFormState(); 
              setShowInputBox(true); 
              if (onOpenNewEntry) onOpenNewEntry();
            }}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {showInputBox && (
        <TouchableWithoutFeedback onPress={handleContainerPress}>
          <View style={[styles.inputContainer, { borderColor: themeColors.primary }]}>
            <Text style={styles.boxTitle}>New Log Entry — {selectedDate}</Text>
            
            <View style={styles.topHeaderRow}>
              <View style={styles.timeBoxWrapper}>
                <Text style={styles.miniLabel}>Time:</Text>
                <TouchableOpacity style={styles.textInputSelector} onPress={() => setShowAddPicker(true)}>
                  <Text style={styles.selectorTimeText}>{formatTimeToString(inputTimeObject)}</Text>
                </TouchableOpacity>
                {showAddPicker && (
                  <DateTimePicker value={inputTimeObject} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={(event, date) => { if (date) setInputTimeObject(date); if (Platform.OS === 'android') setShowAddPicker(false); }} onDismiss={() => setShowAddPicker(false)} />
                )}
              </View>

              <View>
                <Text style={[styles.miniLabel, { textAlign: 'left' }]}>Category:</Text>
                <View style={styles.switchRowInline}>
                  <TouchableOpacity 
                    style={[styles.switchButton, entryType === 'in' && styles.foodSwitchActive]} 
                    onPress={() => setEntryType('in')}
                  >
                    <Image 
                      source={require('../../assets/images/healthy-food.png')} 
                      style={[styles.switchIcon, { tintColor: entryType === 'in' ? themeColors.title : themeColors.muted }]} 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.switchButton, entryType === 'out' && styles.outingSwitchActive]} 
                    onPress={() => setEntryType('out')}
                  >
                    <Image 
                      source={require('../../assets/images/toilet.png')} 
                      style={[styles.switchIcon, { tintColor: entryType === 'out' ? themeColors.title : themeColors.muted }]} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {entryType === 'in' && (
              <>
                <Text style={styles.miniLabel}>Describe what you ate (max 255 chars):</Text>
                <TextInput
                  ref={foodInputRef}
                  style={styles.textInputBox}
                  multiline
                  maxLength={255}
                  placeholder="E.g., 2 eggs, 1 slice whole wheat bread, coffee"
                  placeholderTextColor={themeColors.muted}
                  value={foodText}
                  onChangeText={(text) => {
                    setFoodText(text);
                    if (foodInputError) setFoodInputError(null);
                  }}
                />

                {foodInputError && (
                  <Text style={styles.errorText}>{foodInputError}</Text>
                )}

                <Text style={styles.miniLabel}>Estimated Calories:</Text>
                <View style={styles.calculatedBox}>
                  {isCalculating ? (
                    <ActivityIndicator size="small" color={themeColors.primary} />
                  ) : (
                    <Text style={styles.calculatedText}>🔥 {foodCalories} kcal</Text>
                  )}
                </View>

                <Text style={styles.miniLabel}>Comment / Tag:</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowFoodCommentDropdown(!showFoodCommentDropdown)}>
                  <Text numberOfLines={1} style={styles.dropdownTriggerText}>{foodCommentChoice}</Text>
                </TouchableOpacity>

                {showFoodCommentDropdown && (
                  <View style={styles.dropdownMenu}>
                    {FOOD_COMMENTS.map((c) => (
                      <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setFoodCommentChoice(c); setShowFoodCommentDropdown(false); }}>
                        <Text style={styles.optionText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {foodCommentChoice === 'Other...' && (
                  <>
                    <Text style={styles.miniLabel}>Custom Comment (max 128 chars):</Text>
                    <TextInput
                      style={[styles.textInputBox, { height: 45 }]}
                      maxLength={128}
                      placeholder="Add details..."
                      placeholderTextColor={themeColors.muted}
                      value={customComment}
                      onChangeText={setCustomComment}
                    />
                  </>
                )}
              </>
            )}

            {entryType === 'out' && (
              <>
                <Text style={styles.miniLabel}>Bristol Stool Type:</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowLowerDropdown(!showLowerDropdown)}>
                  <Text numberOfLines={1} style={styles.dropdownTriggerText}>Type {lowerStool} - {BRISTOL_TYPES[lowerStool].substring(0, 25)}...</Text>
                </TouchableOpacity>

                {showLowerDropdown && (
                  <View style={styles.dropdownMenu}>
                    {bristolNumbersArray.map((num) => (
                      <TouchableOpacity key={num} style={styles.dropdownOption} onPress={() => handleLowerStoolChange(num)}>
                        <Text style={styles.optionText}><Text style={{ fontWeight: 'bold' }}>{num}</Text>: {BRISTOL_TYPES[num]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <Text style={styles.miniLabel}>to Type:</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowHigherDropdown(!showHigherDropdown)}>
                  <Text numberOfLines={1} style={styles.dropdownTriggerText}>
                    {higherStool !== null ? `Type ${higherStool} - ${BRISTOL_TYPES[higherStool].substring(0, 25)}...` : "- Select Type Range (Optional) -"}
                  </Text>
                </TouchableOpacity>

                {showHigherDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity style={styles.dropdownOption} onPress={() => { setHigherStool(null); setShowHigherDropdown(false); }}>
                      <Text style={[styles.optionText, { fontStyle: 'italic', color: themeColors.muted }]}>- Select Type Range (Optional) -</Text>
                    </TouchableOpacity>
                    {getAllowedHigherValues(lowerStool).map((num) => (
                      <TouchableOpacity key={num} style={styles.dropdownOption} onPress={() => { setHigherStool(num); setShowHigherDropdown(false); }}>
                        <Text style={styles.optionText}><Text style={{ fontWeight: 'bold' }}>{num}</Text>: {BRISTOL_TYPES[num]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelLinkBtn} onPress={handleCancel}>
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addEntryActionBtn, isAddDisabled && styles.disabledActionBtn]} 
                onPress={handleAdd}
                disabled={isAddDisabled}
              >
                <Text style={styles.actionAddText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {diaryData[selectedDate]?.map((item, index) => {
        const isFood = item.type === 'in';
        const cardBg = isFood ? themeColors.foodBackground : themeColors.outingBackground;
        const cardBorder = isFood ? themeColors.foodBorder : themeColors.outingBorder;
        const cardIcon = isFood ? require('../../assets/images/healthy-food.png') : require('../../assets/images/toilet.png');

        return (
          <View key={index} ref={(el) => (itemRefs.current[index] = el)} collapsable={false}>
            {editingIndex === index ? (
              <TouchableWithoutFeedback onPress={handleContainerPress}>
                <View style={[styles.inputContainer, { borderColor: themeColors.primary }]}>
                  <Text style={styles.boxTitle}>Modify Entry</Text>
                  
                  <View style={styles.topHeaderRow}>
                    <View style={styles.timeBoxWrapper}>
                      <Text style={styles.miniLabel}>Time:</Text>
                      <TouchableOpacity style={styles.textInputSelector} onPress={() => setShowEditPicker(true)}>
                        <Text style={styles.selectorTimeText}>{formatTimeToString(editTimeObject)}</Text>
                      </TouchableOpacity>
                      {showEditPicker && (
                        <DateTimePicker value={editTimeObject} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={(event, date) => { if (date) setEditTimeObject(date); if (Platform.OS === 'android') setShowEditPicker(false); }} onDismiss={() => setShowEditPicker(false)} />
                      )}
                    </View>

                    <View>
                      <Text style={[styles.miniLabel, { textAlign: 'left' }]}>Category:</Text>
                      <View style={styles.switchRowInline}>
                        <TouchableOpacity style={[styles.switchButton, editEntryType === 'in' && styles.foodSwitchActive]} onPress={() => setEditEntryType('in')}>
                          <Image source={require('../../assets/images/healthy-food.png')} style={[styles.switchIcon, { tintColor: editEntryType === 'in' ? themeColors.title : themeColors.muted }]} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.switchButton, editEntryType === 'out' && styles.outingSwitchActive]} onPress={() => setEditEntryType('out')}>
                          <Image source={require('../../assets/images/toilet.png')} style={[styles.switchIcon, { tintColor: editEntryType === 'out' ? themeColors.title : themeColors.muted }]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {editEntryType === 'in' ? (
                    <>
                      <Text style={styles.miniLabel}>Describe what you ate:</Text>
                      <TextInput 
                        ref={editFoodInputRef}
                        style={styles.textInputBox} 
                        multiline 
                        maxLength={255} 
                        value={editFoodText} 
                        onChangeText={(text) => {
                          setEditFoodText(text);
                          if (foodInputError) setFoodInputError(null);
                        }} 
                      />

                      {foodInputError && (
                        <Text style={styles.errorText}>{foodInputError}</Text>
                      )}
                      
                      <Text style={styles.miniLabel}>Estimated Calories:</Text>
                      <View style={styles.calculatedBox}>
                        {isCalculating ? (
                          <ActivityIndicator size="small" color={themeColors.primary} />
                        ) : (
                          <Text style={styles.calculatedText}>🔥 {editFoodCalories} kcal</Text>
                        )}
                      </View>

                      <Text style={styles.miniLabel}>Comment:</Text>
                      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowEditFoodDropdown(!showEditFoodDropdown)}>
                        <Text numberOfLines={1} style={styles.dropdownTriggerText}>{editFoodComment}</Text>
                      </TouchableOpacity>
                      {showEditFoodDropdown && (
                        <View style={styles.dropdownMenu}>
                          {FOOD_COMMENTS.map((c) => (
                            <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setEditFoodComment(c); setShowEditFoodDropdown(false); }}>
                              <Text style={styles.optionText}>{c}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {editFoodComment === 'Other...' && (
                        <TextInput style={[styles.textInputBox, { height: 45 }]} maxLength={128} value={editCustomComment} onChangeText={setEditCustomComment} />
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.miniLabel}>Bristol Stool Type:</Text>
                      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowEditLowerDropdown(!showEditLowerDropdown)}>
                        <Text numberOfLines={1} style={styles.dropdownTriggerText}>Type {editLowerStool} - {BRISTOL_TYPES[editLowerStool].substring(0, 25)}...</Text>
                      </TouchableOpacity>
                      {showEditLowerDropdown && (
                        <View style={styles.dropdownMenu}>
                          {bristolNumbersArray.map((num) => (
                            <TouchableOpacity key={num} style={styles.dropdownOption} onPress={() => handleEditLowerStoolChange(num)}>
                              <Text style={styles.optionText}><Text style={{ fontWeight: 'bold' }}>{num}</Text>: {BRISTOL_TYPES[num]}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      <Text style={styles.miniLabel}>to Type:</Text>
                      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowEditHigherDropdown(!showEditHigherDropdown)}>
                        <Text numberOfLines={1} style={styles.dropdownTriggerText}>
                          {editHigherStool !== null ? `Type ${editHigherStool} - ${BRISTOL_TYPES[editHigherStool].substring(0, 25)}...` : "- Select Type Range (Optional) -"}
                        </Text>
                      </TouchableOpacity>
                      {showEditHigherDropdown && (
                        <View style={styles.dropdownMenu}>
                          <TouchableOpacity style={styles.dropdownOption} onPress={() => { setEditHigherStool(null); setShowEditHigherDropdown(false); }}>
                            <Text style={[styles.optionText, { fontStyle: 'italic', color: themeColors.muted }]}>- Select Type Range (Optional) -</Text>
                          </TouchableOpacity>
                          {getAllowedHigherValues(editLowerStool).map((num) => (
                            <TouchableOpacity key={num} style={styles.dropdownOption} onPress={() => { setEditHigherStool(num); setShowEditHigherDropdown(false); }}>
                              <Text style={styles.optionText}><Text style={{ fontWeight: 'bold' }}>{num}</Text>: {BRISTOL_TYPES[num]}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  <View style={styles.editActionRowControls}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => deleteLogEntry(selectedDate, index)}>
                      <Trash2 size={22} color={themeColors.danger} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.cancelLinkBtn} onPress={() => setEditingIndex(null)}>
                        <Text style={styles.cancelLinkText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.addEntryActionBtn, isEditDisabled && styles.disabledActionBtn]} 
                        onPress={() => handleEditSave(index)}
                        disabled={isEditDisabled}
                      >
                        <Text style={styles.actionAddText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <TouchableOpacity 
                style={[styles.historyItemRow, { backgroundColor: cardBg, borderColor: cardBorder }]} 
                onPress={() => triggerEditMode(item, index)}
              >
                <View style={styles.rowMeta}>
                  <Image source={cardIcon} style={[styles.itemIcon, { tintColor: themeColors.title }]} />
                  <Text style={styles.historyText}>
                    <Text style={styles.boldText}>{item.timestamp}</Text> {isFood ? `— 🍔 "${item.foodText}" (${item.calories || 0} kcal) [${item.comment}]` : `— 🚽 ${renderStoolEntryText(item)}`}
                  </Text>
                </View>
                
                <View style={styles.actionButtonContainer}>
                  <View style={styles.actionRowIconBtn}><Pencil size={16} color={themeColors.primary} /></View>
                  <TouchableOpacity style={styles.actionRowIconBtn} onPress={(e) => { e.stopPropagation(); deleteLogEntry(selectedDate, index); }}>
                    <Trash2 size={16} color={themeColors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        );
      }) || <Text style={styles.emptyText}>No activities logged for this day.</Text>}
    </View>
  );
}