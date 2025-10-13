import { TAB_BAR_HEIGHT } from "@/constants/device";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { useWindowDimensions } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";

interface CustomTabBarProps extends BottomTabBarProps {
  scrollY: SharedValue<number>;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  scrollY,
  ...tabBarProps
}) => {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const lastScrollY = useRef(0);
  const visibleValue = useRef(true);

  const { width } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    let visible = visibleValue.current;
    if (scrollY.value > lastScrollY.current + 10) {
      visible = false;
    } else if (scrollY.value < lastScrollY.current - 10 || scrollY.value <= 0) {
      visible = true;
    }
    lastScrollY.current = scrollY.value;
    visibleValue.current = visible;

    const hideY = TAB_BAR_HEIGHT + insets.bottom;
    return {
      transform: [
        {
          translateY: withTiming(visible ? 0 : hideY, { duration: 220 }),
        },
      ],
    };
  });

  // 🎯 Animated indicator
  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = width / tabBarProps.state.routes.length;
    return {
      width: tabWidth,
      left: withTiming(tabBarProps.state.index * tabWidth, {
        duration: 300,
        easing: Easing.elastic(1),
      }),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={[PRIMARY_COLOR, TERTIARY_COLOR]} // customize gradient colors
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          {
            height: TAB_BAR_HEIGHT + insets.bottom,
          },
        ]}
      />
      <BottomTabBar {...tabBarProps} style={[{ height: TAB_BAR_HEIGHT }]} />
      <Animated.View style={[styles.slidingIndicator, indicatorStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  slidingIndicator: {
    backgroundColor: theme.colors.tertiary,
    position: "absolute",
    top: 0,
    height: 3,
    elevation: 3,
  },
}));

export default CustomTabBar;
