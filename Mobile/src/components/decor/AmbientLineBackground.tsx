import { StyleSheet, View } from 'react-native';

interface Props {
  variant?: 'chat' | 'onboarding';
}

export function AmbientLineBackground({ variant = 'chat' }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <View style={[styles.loop, variant === 'chat' ? styles.chatLoopTop : styles.onboardingLoopTop]} />
      <View style={[styles.loop, variant === 'chat' ? styles.chatLoopBottom : styles.onboardingLoopBottom]} />
      <View style={[styles.line, variant === 'chat' ? styles.chatLine : styles.onboardingLine]} />
    </View>
  );
}

const styles = StyleSheet.create({
  loop: {
    position: 'absolute',
    borderWidth: 1.25,
    borderColor: 'rgba(59, 7, 100, 0.075)',
    borderRadius: 160,
  },
  line: {
    position: 'absolute',
    height: 1.25,
    borderRadius: 1,
    backgroundColor: 'rgba(59, 7, 100, 0.075)',
  },
  chatLoopTop: {
    width: 310,
    height: 150,
    top: 34,
    right: -160,
    transform: [{ rotate: '-22deg' }],
  },
  chatLoopBottom: {
    width: 360,
    height: 190,
    bottom: 56,
    left: -220,
    transform: [{ rotate: '26deg' }],
  },
  chatLine: {
    width: 190,
    top: 182,
    left: -48,
    transform: [{ rotate: '42deg' }],
  },
  onboardingLoopTop: {
    width: 280,
    height: 132,
    top: 58,
    left: -176,
    transform: [{ rotate: '18deg' }],
  },
  onboardingLoopBottom: {
    width: 330,
    height: 170,
    bottom: 8,
    right: -218,
    transform: [{ rotate: '-34deg' }],
  },
  onboardingLine: {
    width: 150,
    bottom: 164,
    left: -34,
    transform: [{ rotate: '-28deg' }],
  },
});
