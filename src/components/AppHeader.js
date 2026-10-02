import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useThemeColors } from '../constants/config';

const HEADER_HEIGHT = 56;
const SIDE_SLOT_WIDTH = 48;

// Fixed top bar: hamburger on the left, centered title, and an empty right slot
// that keeps the title centered and leaves room for the Expo dev tools button.
export default function AppHeader({ title, onMenuPress }) {
  const themeColors = useThemeColors();

  const styles = StyleSheet.create({
    header: {
      height: HEADER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
      zIndex: 10,
    },
    sideSlot: { width: SIDE_SLOT_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' },
    menuButton: { padding: 8, borderRadius: 20 },
    menuButtonPressed: { backgroundColor: themeColors.secondaryBtn },
    title: {
      flex: 1,
      fontSize: 23,
      fontWeight: 'bold',
      textAlign: 'center',
      color: themeColors.title,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
  });

  return (
    <View style={styles.header}>
      <View style={styles.sideSlot}>
        <Pressable
          onPress={onMenuPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
          <Menu size={24} color={themeColors.title} />
        </Pressable>
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.sideSlot} />
    </View>
  );
}
