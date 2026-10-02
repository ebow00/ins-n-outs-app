import React, { useState } from 'react';
import { View, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useThemeColors } from '../constants/config';

const SCREEN_MARGIN = 12;
const ANCHOR_GAP = 8;
const FADE_IN_MS = 120;

// Themed floating bubble shared by the day context menu and app alerts.
// Sizes to its content, closes instantly when the user taps anywhere outside it.
// With `anchor` ({ x, y, width, height } in window coordinates) it opens just below that rect,
// shifted inward if needed to stay on screen; without it, it is centered on the screen.
export default function PopupBubble({ visible, anchor, onDismiss, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDismiss}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      {/* Mounted only while visible, so its measured width resets for every opening */}
      {visible && <BubbleLayout anchor={anchor}>{children}</BubbleLayout>}
    </Modal>
  );
}

function BubbleLayout({ anchor, children }) {
  const themeColors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const [bubbleWidth, setBubbleWidth] = useState(null);

  const styles = StyleSheet.create({
    bubble: {
      maxWidth: Math.min(screenWidth - SCREEN_MARGIN * 2, 340),
      backgroundColor: themeColors.popupBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.popupBorder,
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
      overflow: 'hidden',
    },
    centered: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
    anchorRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  });

  let anchoredStyle = null;
  if (anchor) {
    // Center the bubble under the anchor, clamped so it stays fully on screen
    const desiredShift = anchor.x + anchor.width / 2 - screenWidth / 2;
    const maxShift = bubbleWidth == null ? 0 : Math.max(0, (screenWidth - bubbleWidth) / 2 - SCREEN_MARGIN);
    const shift = Math.max(-maxShift, Math.min(maxShift, desiredShift));
    anchoredStyle = [
      styles.anchorRow,
      { top: anchor.y + anchor.height + ANCHOR_GAP, transform: [{ translateX: shift }] },
      // Hidden for the single frame before the bubble's width is known
      bubbleWidth == null && { opacity: 0 },
    ];
  }

  return (
    <View pointerEvents="box-none" style={anchor ? anchoredStyle : styles.centered}>
      <Animated.View
        entering={FadeIn.duration(FADE_IN_MS)}
        onLayout={(e) => setBubbleWidth(e.nativeEvent.layout.width)}
        style={styles.bubble}>
        {children}
      </Animated.View>
    </View>
  );
}
