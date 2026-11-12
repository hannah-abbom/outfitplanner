import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/*
 * Small motions that make the app feel handled rather than clicked: things sink a little under the finger and
 * spring back. Each one is skipped when the system asks for reduced motion.
 */

export const SPRING = { damping: 15, stiffness: 320, mass: 0.6 } as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; to?: number };

/** A Pressable that sinks under the finger and springs back. */
export function PressScale({ to = 0.95, style, onPressIn, onPressOut, ...props }: Props) {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        if (!reduce) scale.set(withSpring(to, SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(e);
      }}
      style={[style, anim]}
    />
  );
}
