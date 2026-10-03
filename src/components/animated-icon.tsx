import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
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

// Splash sequence: blue fades in, holds, logo fades in, holds, then everything dissolves into the app.
// SPLASH_BASE_COLOR must match the native splash backgroundColor in app.json so the handoff is seamless.
const SPLASH_BASE_COLOR = '#FFFFFF';
const SPLASH_BLUE = '#004FC6';
const SPLASH_BLUE_FADE_IN = 800;
const SPLASH_BLUE_HOLD = 2000;
const SPLASH_LOGO_FADE_IN = 800;
const SPLASH_LOGO_HOLD = 4000;
const SPLASH_FADE_OUT = 700;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const started = useRef(false);
  const blueOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.92);
  const overlayOpacity = useSharedValue(1);

  const blueStyle = useAnimatedStyle(() => ({ opacity: blueOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  if (!visible) return null;

  const start = () => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync().finally(() => {
      const easing = Easing.out(Easing.cubic);
      const logoDelay = SPLASH_BLUE_FADE_IN + SPLASH_BLUE_HOLD;
      const dissolveDelay = logoDelay + SPLASH_LOGO_FADE_IN + SPLASH_LOGO_HOLD;

      blueOpacity.set(withTiming(1, { duration: SPLASH_BLUE_FADE_IN, easing }));
      logoOpacity.set(withDelay(logoDelay, withTiming(1, { duration: SPLASH_LOGO_FADE_IN, easing })));
      logoScale.set(withDelay(logoDelay, withTiming(1, { duration: SPLASH_LOGO_FADE_IN, easing })));
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
    width: 220,
    height: 220,
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
