// 스티커 부여 시 팡! 터지는 축하 효과
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_PIECES = 24;
const EMOJIS = ['🎉', '⭐', '✨', '💛', '🎊', '💖', '🌟', '🔥'];

interface Props {
  visible: boolean;
  emoji?: string;
  onFinish?: () => void;
}

export default function ConfettiOverlay({ visible, emoji, onFinish }: Props) {
  const pieces = useRef(
    Array.from({ length: CONFETTI_PIECES }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const centerScale = useRef(new Animated.Value(0)).current;
  const centerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // 중앙 스티커 팡! 효과
    Animated.sequence([
      Animated.parallel([
        Animated.spring(centerScale, { toValue: 1.3, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.timing(centerOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.spring(centerScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(centerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onFinish?.());

    // 색종이 조각들
    pieces.forEach((piece, i) => {
      const angle = (i / CONFETTI_PIECES) * Math.PI * 2;
      const distance = 80 + Math.random() * 120;

      piece.x.setValue(0);
      piece.y.setValue(0);
      piece.scale.setValue(0);
      piece.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(piece.x, {
          toValue: Math.cos(angle) * distance,
          duration: 600 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(piece.y, {
          toValue: Math.sin(angle) * distance - 40,
          duration: 600 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(piece.scale, { toValue: 1 + Math.random() * 0.5, friction: 4, useNativeDriver: true }),
          Animated.timing(piece.scale, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(piece.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* 색종이 */}
      {pieces.map((piece, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.confettiPiece,
            {
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
            },
          ]}
        >
          {EMOJIS[i % EMOJIS.length]}
        </Animated.Text>
      ))}

      {/* 중앙 스티커 */}
      <Animated.Text
        style={[
          styles.centerEmoji,
          {
            transform: [{ scale: centerScale }],
            opacity: centerOpacity,
          },
        ]}
      >
        {emoji ?? '⭐'}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 20,
  },
  centerEmoji: {
    fontSize: 72,
  },
});
