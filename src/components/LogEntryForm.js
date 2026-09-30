import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image, TextInput, Platform, Keyboard, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Trash2 } from 'lucide-react-native';
import { useThemeColors, BRISTOL_TYPES, FOOD_COMMENTS } from '../constants/config';
import { useAICalories } from '../hooks/useAICalories';

export default function LogEntryForm({ 
  mode = 'add', 
  initialData = null, 
  selectedDate, 
  onSubmit, 
  onCancel, 
  onDelete,
  onFormDirtyChange 
}) {
  const themeColors = useThemeColors();
  const { computeCalories, isCalculating, foodInputError, setFoodInputError } = useAICalories();
  const bristolNumbersArray = Array.from({ length: 7 }, (_, i) => i + 1);
  const inputRef = useRef(null);

  const parseInitialTime = (timestamp) => {
    if (!timestamp) return new Date();
    const parts = timestamp.split(':');
    const d = new Date();
    d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10));
    return d;
  };

  const [timeObject, setTimeObject] = useState(() => parseInitialTime(initialData?.timestamp));
  const [showPicker, setShowPicker] = useState(false);
  const [entryType, setEntryType] = useState(initialData?.type || 'in');
  
  const [foodText, setFoodText] = useState(initialData?.foodText || '');
  const [foodCalories, setFoodCalories] = useState(initialData?.calories || 0);
  
  const initialComment = initialData?.comment 
    ? (FOOD_COMMENTS.includes(initialData.comment) ? initialData.comment : 'Other...')
    : FOOD_COMMENTS[0];
  const initialCustom = initialComment === 'Other...' ? initialData?.comment : '';
  
  const [commentChoice, setCommentChoice] = useState(initialComment);
  const [customComment, setCustomComment] = useState(initialCustom);
  const [showCommentDropdown, setShowCommentDropdown] = useState(false);

  const [lowerStool, setLowerStool] = useState(initialData?.lowerStool || 4);
  const [higherStool, setHigherStool] = useState(initialData?.higherStool !== undefined ? initialData.higherStool : null);
  const [showLowerDropdown, setShowLowerDropdown] = useState(false);
  const [showHigherDropdown, setShowHigherDropdown] = useState(false);

  const hasContent = (entryType === 'in' && foodText.trim() !== '') || (entryType === 'out' && (lowerStool !== 4 || higherStool !== null));

  useEffect(() => {
    if (onFormDirtyChange) onFormDirtyChange(hasContent);
  }, [hasContent]);

  useEffect(() => {
    const handleKeyboardHide = async () => {
      if (entryType === 'in') {
        const result = await computeCalories(foodText);
        setFoodCalories(result.isValid ? result.calories : 0);
      }
    };
    const subscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => subscription.remove();
  }, [entryType, foodText]);

  const handleContainerPress = () => {
    if (inputRef.current) inputRef.current.blur();
    Keyboard.dismiss();
  };

  const getAllowedHigherValues = (val) => {
    let allowed = [val];
    if (val > 1) allowed.push(val - 1);
    if (val < 7) allowed.push(val + 1);
    return allowed.sort((a, b) => a - b);
  };

  const handleLowerChange = (val) => {
    setLowerStool(val);
    if (higherStool !== null && !getAllowedHigherValues(val).includes(higherStool)) {
      setHigherStool(null);
    }
    setShowLowerDropdown(false);
  };

  const isDisabled = entryType === 'in' && (!foodText.trim() || isCalculating || foodInputError !== null);

  const handleSave = () => {
    if (isDisabled) return;
    handleContainerPress();
    
    const timestamp = timeObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const payload = { timestamp, type: entryType };

    if (entryType === 'in') {
      payload.foodText = foodText;
      payload.calories = foodCalories;
      payload.comment = commentChoice === 'Other...' ? customComment : commentChoice;
    } else {
      payload.lowerStool = lowerStool;
      payload.higherStool = higherStool;
    }
    
    onSubmit(payload);
  };

  const styles = StyleSheet.create({
    inputContainer: { backgroundColor: themeColors.inputBg, padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: themeColors.primary },
    boxTitle: { fontSize: 14, fontWeight: 'bold', color: themeColors.iconMuted, marginBottom: 6 },
    miniLabel: { fontSize: 11, color: themeColors.muted, marginBottom: 2, fontWeight: '600' },
    topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    timeBoxWrapper: { alignSelf: 'flex-start' },
    textInputSelector: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF', height: 40, justifyContent: 'center' },
    selectorTimeText: { fontSize: 14, color: themeColors.title, fontWeight: '500' },
    switchRowInline: { flexDirection: 'row', gap: 8 },
    switchButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: themeColors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.secondaryBtn },
    foodSwitchActive: { backgroundColor: themeColors.foodBackground, borderColor: themeColors.foodBorder },
    outingSwitchActive: { backgroundColor: themeColors.outingBackground, borderColor: themeColors.outingBorder },
    switchIcon: { width: 20, height: 20, resizeMode: 'contain' },
    textInputBox: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: '#FFFFFF', color: themeColors.title, fontSize: 14, height: 70, textAlignVertical: 'top', marginBottom: 10 },
    calculatedBox: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: themeColors.secondaryBtn, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    calculatedText: { fontSize: 13, color: themeColors.text, fontWeight: '600' },
    errorText: { fontSize: 12, color: themeColors.danger, marginBottom: 10, fontWeight: '600' },
    dropdownTrigger: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, padding: 10, backgroundColor: '#FFFFFF', height: 40, justifyContent: 'center', marginBottom: 10 },
    dropdownTriggerText: { fontSize: 13, color: themeColors.text },
    dropdownMenu: { borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, backgroundColor: themeColors.card, marginBottom: 10 },
    dropdownOption: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: themeColors.dropdownOptionBorder, paddingHorizontal: 6 },
    optionText: { fontSize: 12, color: themeColors.text },
    actionRowControls: { flexDirection: 'row', justifyContent: mode === 'edit' ? 'space-between' : 'flex-end', marginTop: 12, paddingHorizontal: 4 },
    actionRowRight: { flexDirection: 'row', gap: 8 },
    addEntryActionBtn: { backgroundColor: themeColors.primary, height: 40, paddingHorizontal: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    disabledActionBtn: { backgroundColor: themeColors.muted, opacity: 0.5 },
    actionAddText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
    cancelLinkBtn: { height: 40, paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: themeColors.border },
    cancelLinkText: { color: themeColors.muted, fontSize: 14 },
    iconButton: { padding: 8 }
  });

  return (
    <TouchableWithoutFeedback onPress={handleContainerPress}>
      <View style={styles.inputContainer}>
        <Text style={styles.boxTitle}>{mode === 'add' ? `New Log Entry — ${selectedDate}` : 'Modify Entry'}</Text>
        
        <View style={styles.topHeaderRow}>
          <View style={styles.timeBoxWrapper}>
            <Text style={styles.miniLabel}>Time:</Text>
            <TouchableOpacity style={styles.textInputSelector} onPress={() => setShowPicker(true)}>
              <Text style={styles.selectorTimeText}>{timeObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker value={timeObject} mode="time" is24Hour={true} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onValueChange={(_, date) => { if (date) setTimeObject(date); if (Platform.OS === 'android') setShowPicker(false); }} onDismiss={() => setShowPicker(false)} />
            )}
          </View>

          <View>
            <Text style={[styles.miniLabel, { textAlign: 'left' }]}>Category:</Text>
            <View style={styles.switchRowInline}>
              <TouchableOpacity style={[styles.switchButton, entryType === 'in' && styles.foodSwitchActive]} onPress={() => setEntryType('in')}>
                <Image source={require('../../assets/images/healthy-food.png')} style={[styles.switchIcon, { tintColor: entryType === 'in' ? themeColors.title : themeColors.muted }]} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.switchButton, entryType === 'out' && styles.outingSwitchActive]} onPress={() => setEntryType('out')}>
                <Image source={require('../../assets/images/toilet.png')} style={[styles.switchIcon, { tintColor: entryType === 'out' ? themeColors.title : themeColors.muted }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {entryType === 'in' ? (
          <>
            <Text style={styles.miniLabel}>Describe what you ate:</Text>
            <TextInput ref={inputRef} style={styles.textInputBox} multiline maxLength={255} value={foodText} placeholder="E.g., 2 eggs, 1 slice whole wheat bread..." placeholderTextColor={themeColors.muted} onChangeText={(text) => { setFoodText(text); if (foodInputError) setFoodInputError(null); }} />
            {foodInputError && <Text style={styles.errorText}>{foodInputError}</Text>}

            <Text style={styles.miniLabel}>Estimated Calories:</Text>
            <View style={styles.calculatedBox}>
              {isCalculating ? <ActivityIndicator size="small" color={themeColors.primary} /> : <Text style={styles.calculatedText}>🔥 {foodCalories} kcal</Text>}
            </View>

            <Text style={styles.miniLabel}>Comment / Tag:</Text>
            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowCommentDropdown(!showCommentDropdown)}>
              <Text numberOfLines={1} style={styles.dropdownTriggerText}>{commentChoice}</Text>
            </TouchableOpacity>
            {showCommentDropdown && (
              <View style={styles.dropdownMenu}>
                {FOOD_COMMENTS.map((c) => (
                  <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setCommentChoice(c); setShowCommentDropdown(false); }}>
                    <Text style={styles.optionText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {commentChoice === 'Other...' && (
              <TextInput style={[styles.textInputBox, { height: 45 }]} maxLength={128} value={customComment} placeholder="Add details..." placeholderTextColor={themeColors.muted} onChangeText={setCustomComment} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.miniLabel}>Bristol Stool Type:</Text>
            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowLowerDropdown(!showLowerDropdown)}>
              <Text numberOfLines={1} style={styles.dropdownTriggerText}>Type {lowerStool} - {BRISTOL_TYPES[lowerStool].substring(0, 25)}...</Text>
            </TouchableOpacity>
            {showLowerDropdown && (
              <View style={styles.dropdownMenu}>
                {bristolNumbersArray.map((num) => (
                  <TouchableOpacity key={num} style={styles.dropdownOption} onPress={() => handleLowerChange(num)}>
                    <Text style={styles.optionText}><Text style={{ fontWeight: 'bold' }}>{num}</Text>: {BRISTOL_TYPES[num]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.miniLabel}>to Type:</Text>
            <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setShowHigherDropdown(!showHigherDropdown)}>
              <Text numberOfLines={1} style={styles.dropdownTriggerText}>{higherStool !== null ? `Type ${higherStool} - ${BRISTOL_TYPES[higherStool].substring(0, 25)}...` : "- Select Type Range (Optional) -"}</Text>
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

        <View style={styles.actionRowControls}>
          {mode === 'edit' && (
            <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
              <Trash2 size={22} color={themeColors.danger} />
            </TouchableOpacity>
          )}
          <View style={styles.actionRowRight}>
            <TouchableOpacity style={styles.cancelLinkBtn} onPress={onCancel}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addEntryActionBtn, isDisabled && styles.disabledActionBtn]} onPress={handleSave} disabled={isDisabled}>
              <Text style={styles.actionAddText}>{mode === 'add' ? 'Add Entry' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}