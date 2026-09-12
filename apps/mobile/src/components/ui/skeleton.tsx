import { useEffect, useState } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useAppTheme } from "@/theme/use-app-theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, radius, style }: SkeletonProps) {
  const theme = useAppTheme();
  // Lazy useState (not useRef) for the Animated.Value: its whole point is to
  // be read during render (as the `opacity` style below), which is exactly
  // what refs aren't supposed to be used for.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: theme.colors.surfaceSunken,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonList({ rows = 3, rowHeight = 56 }: { rows?: number; rowHeight?: number }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} radius={theme.radii.md} />
      ))}
    </View>
  );
}
