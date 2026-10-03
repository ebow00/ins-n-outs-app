import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

// Splash sequence: blue fades in, holds, logo fades in, then a random message appears under it
// (one line, or two lines in turn), holds, and everything dissolves into the app.
// SPLASH_BASE_COLOR must match the native splash backgroundColor in app.json so the handoff is seamless.
const SPLASH_BASE_COLOR = '#FFFFFF';
const SPLASH_BLUE = '#004FC6';
const SPLASH_BLUE_FADE_IN = 800;
const SPLASH_BLUE_HOLD = 600;
const SPLASH_LOGO_FADE_IN = 800;
const SPLASH_MESSAGE_DELAY = 750;
const SPLASH_LINE_FADE_IN = 1200;
const SPLASH_ONE_LINE_HOLD = 3000;
const SPLASH_TWO_LINE_HOLD = 2500;
const SPLASH_FADE_OUT = 700;
const SPLASH_IMAGE_SIZE = 220;

// Each message is one line or two lines
const SPLASH_MESSAGES: string[][] = [
  ["Don't let it hit you on its way out"],
  ["Don't forget to wash your hands"],
  ['You are what you eat.', 'Eat well'],
  ['Sometimes it burns twice.', 'Once when you eat it'],
];

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [message] = useState(() => SPLASH_MESSAGES[Math.floor(Math.random() * SPLASH_MESSAGES.length)]);
  const started = useRef(false);
  const blueOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const line1Opacity = useSharedValue(0);
  const line2Opacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  const blueStyle = useAnimatedStyle(() => ({ opacity: blueOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const line1Style = useAnimatedStyle(() => ({ opacity: line1Opacity.value }));
  const line2Style = useAnimatedStyle(() => ({ opacity: line2Opacity.value }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  if (!visible) return null;

  const start = () => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync().finally(() => {
      const easing = Easing.out(Easing.cubic);
      const logoDelay = SPLASH_BLUE_FADE_IN + SPLASH_BLUE_HOLD;
      const line1Delay = logoDelay + SPLASH_LOGO_FADE_IN + SPLASH_MESSAGE_DELAY;
      const line2Delay = line1Delay + SPLASH_LINE_FADE_IN + SPLASH_TWO_LINE_HOLD;
      const dissolveDelay =
        message.length > 1
          ? line2Delay + SPLASH_LINE_FADE_IN + SPLASH_TWO_LINE_HOLD
          : line1Delay + SPLASH_LINE_FADE_IN + SPLASH_ONE_LINE_HOLD;

      blueOpacity.set(withTiming(1, { duration: SPLASH_BLUE_FADE_IN, easing }));
      logoOpacity.set(withDelay(logoDelay, withTiming(1, { duration: SPLASH_LOGO_FADE_IN, easing })));
      logoScale.set(withDelay(logoDelay, withTiming(1, { duration: SPLASH_LOGO_FADE_IN, easing })));
      // Gentler than the logo's ease-out, which makes text seem to pop in rather than fade
      const lineEasing = Easing.inOut(Easing.quad);
      line1Opacity.set(withDelay(line1Delay, withTiming(1, { duration: SPLASH_LINE_FADE_IN, easing: lineEasing })));
      if (message.length > 1) {
        line2Opacity.set(withDelay(line2Delay, withTiming(1, { duration: SPLASH_LINE_FADE_IN, easing: lineEasing })));
      }
      overlayOpacity.set(
        withDelay(
          dissolveDelay,
          withTiming(0, { duration: SPLASH_FADE_OUT, easing: Easing.inOut(Easing.quad) }, (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(setVisible, false);
            }
          })
        )
      );
    });
  };

  return (
    // Composite the overlay as one layer so the icon square and background dissolve together
    // (otherwise Android applies opacity to each child separately and the square shows through).
    <Animated.View
      onLayout={start}
      needsOffscreenAlphaCompositing
      renderToHardwareTextureAndroid
      style={[styles.splashOverlay, overlayStyle]}>
      <Animated.View style={[styles.splashBlue, blueStyle]} />
      <Animated.View style={logoStyle}>
        <Image style={styles.splashImage} source={require('@/assets/images/Ins_n_Outs_image.png')} />
      </Animated.View>
      {/* Anchored just below the centered logo so the logo doesn't shift; both lines are laid out up front */}
      <View style={styles.splashMessage}>
        {message.map((line, i) => (
          <Animated.View key={i} style={i === 0 ? line1Style : line2Style}>
            <Text style={[styles.splashMessageText, i > 0 && styles.splashMessageSecondLine]}>{line}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashImage: {
    width: SPLASH_IMAGE_SIZE,
    height: SPLASH_IMAGE_SIZE,
  },
  splashMessage: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: SPLASH_IMAGE_SIZE / 2 + 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  splashMessageText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  splashMessageSecondLine: {
    fontStyle: 'italic',
  },
  splashBlue: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BLUE,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BASE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
