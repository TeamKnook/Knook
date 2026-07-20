import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/theme';

interface Props {
  testID?: string;
}

function Eye() {
  return <View style={styles.eye} />;
}

export function AnonymousChatIllustration({ testID }: Props) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Knook anonymous chat message"
      style={styles.wrap}
    >
      <View style={styles.wordmark}>
        <Text allowFontScaling={false} style={styles.wordPart}>kn</Text>
        <View style={styles.eyes}>
          <Eye />
          <Eye />
          <View style={styles.flightTrail} />
          <View style={styles.plane}>
            <Ionicons name="paper-plane" size={20} color={colors.knookYellow} />
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.wordPart}>k</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    paddingTop: spacing.md,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordPart: {
    fontFamily: 'Outfit_900Black',
    color: colors.knookDark,
    fontSize: 58,
    lineHeight: 68,
  },
  eyes: {
    width: 92,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  eye: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: colors.knookDark,
    backgroundColor: colors.knookOffWhite,
  },
  flightTrail: {
    position: 'absolute',
    right: -8,
    top: 10,
    width: 25,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.knookYellow,
    transform: [{ rotate: '-25deg' }],
  },
  plane: {
    position: 'absolute',
    right: -29,
    top: -7,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
});
