import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, UIManager, View } from 'react-native';
import LottieView from 'lottie-react-native';

import {
  knookIllustrationDarkStates,
  knookOoAnimations,
  type KnookIllustrationState,
} from '@/src/illustrations/knookOoAnimations';
import { colors } from '@/src/theme';

type IllustrationSize = 'small' | 'medium' | 'large';

interface Props {
  state: KnookIllustrationState;
  size?: IllustrationSize;
  loop?: boolean;
  testID?: string;
}

const dimensions: Record<IllustrationSize, { height: number; fontSize: number; ooWidth: number }> = {
  small: { height: 48, fontSize: 36, ooWidth: 58 },
  medium: { height: 78, fontSize: 56, ooWidth: 86 },
  large: { height: 112, fontSize: 76, ooWidth: 116 },
};

const labels: Record<KnookIllustrationState, string> = {
  sleepy: 'Knook waking up',
  binoculars: 'Knook looking for your private circle',
  hearts: 'Knook daily reveal match',
  cupid: 'Knook anonymous chat',
  surprise: 'Knook identity reveal',
  unhook: 'Knook saying goodbye for now',
  mirror: 'Knook profile reflection',
};

const lottieNativeAvailable = UIManager.hasViewManagerConfig('LottieAnimationView');

function StaticOoFallback({
  state,
  dark,
  width,
  height,
}: {
  state: KnookIllustrationState;
  dark: boolean;
  width: number;
  height: number;
}) {
  const foreground = dark ? colors.white : colors.knookDark;
  const mark = state === 'hearts' ? '♥♥' : state === 'sleepy' || state === 'unhook' ? '⌣⌣' : 'oo';

  return (
    <View style={[styles.staticOo, { width, height }]}>
      <Text
        allowFontScaling={false}
        style={[
          styles.staticOoText,
          { color: state === 'hearts' ? colors.knookYellow : foreground, fontSize: height * 0.58 },
        ]}
      >
        {mark}
      </Text>
      {state === 'surprise' || state === 'mirror' ? <View style={styles.staticAccent} /> : null}
    </View>
  );
}

export function KnookIllustration({ state, size = 'medium', loop = true, testID }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const dark = knookIllustrationDarkStates.has(state);
  const metrics = dimensions[size];

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={labels[state]}
      style={[
        styles.frame,
        { minHeight: metrics.height },
        dark ? styles.frameDark : styles.frameLight,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.wordPart,
          { fontSize: metrics.fontSize, lineHeight: metrics.height },
          dark ? styles.wordLight : styles.wordDark,
        ]}
      >
        kn
      </Text>
      {lottieNativeAvailable ? (
        <LottieView
          source={knookOoAnimations[state]}
          autoPlay={!reduceMotion}
          loop={loop && !reduceMotion}
          progress={reduceMotion ? 0.5 : undefined}
          resizeMode="contain"
          style={{ width: metrics.ooWidth, height: metrics.height }}
        />
      ) : (
        <StaticOoFallback state={state} dark={dark} width={metrics.ooWidth} height={metrics.height} />
      )}
      <Text
        allowFontScaling={false}
        style={[
          styles.wordPart,
          { fontSize: metrics.fontSize, lineHeight: metrics.height },
          dark ? styles.wordLight : styles.wordDark,
        ]}
      >
        k
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  frameDark: { backgroundColor: colors.knookPurple },
  frameLight: { backgroundColor: colors.transparent },
  wordPart: { fontFamily: 'Outfit_900Black' },
  wordDark: { color: colors.knookDark },
  wordLight: { color: colors.white },
  staticOo: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  staticOoText: { fontFamily: 'Outfit_900Black', lineHeight: undefined, letterSpacing: 0 },
  staticAccent: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.knookYellow,
  },
});
