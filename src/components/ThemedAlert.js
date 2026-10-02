import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import PopupBubble from './PopupBubble';
import { useThemeColors } from '../constants/config';

let showListener = null;

// Drop-in replacement for Alert.alert(title, message, buttons) that renders in the app's themed bubble.
// Tapping outside the bubble acts like the "cancel" button (if there is one) and closes it.
// Falls back to the native alert if <ThemedAlertHost /> isn't mounted.
export const ThemedAlert = {
  alert(title, message, buttons = [{ text: 'OK' }]) {
    if (showListener) showListener({ title, message, buttons });
    else Alert.alert(title, message, buttons);
  },
};

// Mount once near the app root.
export function ThemedAlertHost() {
  const themeColors = useThemeColors();
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    showListener = setCurrent;
    return () => {
      if (showListener === setCurrent) showListener = null;
    };
  }, []);

  const close = (button) => {
    setCurrent(null);
    button?.onPress?.();
  };

  const dismiss = () => close(current?.buttons.find((b) => b.style === 'cancel'));

  const styles = StyleSheet.create({
    content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 6, alignItems: 'center' },
    title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: themeColors.title },
    message: { fontSize: 14, fontWeight: '500', textAlign: 'center', color: themeColors.text, marginTop: 6 },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    button: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    buttonPressed: { backgroundColor: themeColors.popupPressed },
    buttonText: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: themeColors.primary },
    cancelText: { color: themeColors.muted },
    destructiveText: { color: themeColors.danger },
  });

  return (
    <PopupBubble visible={!!current} onDismiss={dismiss}>
      {current && (
        <View style={styles.content}>
          {!!current.title && <Text style={styles.title}>{current.title}</Text>}
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}
          <View style={styles.buttonRow}>
            {current.buttons.map((button, i) => (
              <Pressable
                key={i}
                onPress={() => close(button)}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelText,
                    button.style === 'destructive' && styles.destructiveText,
                  ]}>
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </PopupBubble>
  );
}
