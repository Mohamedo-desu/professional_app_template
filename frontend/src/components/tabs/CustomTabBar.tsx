import { TAB_BAR_HEIGHT } from "@/constants/device";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import { TouchableOpacity, useWindowDimensions } from "react-native";
import { MagnifyingGlassIcon } from "react-native-heroicons/solid";
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

  // ⚙️ TabBar show/hide animation on scroll
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

  // 🎯 Sliding indicator animation
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

  // ✅ Condition: show FAB only when active tab is index 1 (change as needed)
  const showFab = tabBarProps.state.index === 0;

  return (
    <>
      {showFab && (
        <LinearGradient
          colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.fabContainer}
        >
          <TouchableOpacity
            onPress={() => router.navigate("/(main)/Search")}
            activeOpacity={0.8}
            style={styles.fab}
          >
            <MagnifyingGlassIcon size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      )}
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Gradient background */}

        <LinearGradient
          colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            {
              height: TAB_BAR_HEIGHT + insets.bottom,
            },
          ]}
        />
        {/* React Navigation bottom tab bar */}
        <BottomTabBar
          {...tabBarProps}
          style={[{ height: TAB_BAR_HEIGHT, backgroundColor: "transparent" }]}
          {...{
            ...tabBarProps,
            descriptors: Object.fromEntries(
              Object.entries(tabBarProps.descriptors).map(
                ([key, descriptor]) => [
                  key,
                  {
                    ...descriptor,
                    options: {
                      ...descriptor.options,
                      tabBarShowLabel: false,
                    },
                  },
                ]
              )
            ),
          }}
        />
        {/* Sliding indicator */}
        <Animated.View style={[styles.slidingIndicator, indicatorStyle]} />
        {/* ✅ Floating action button (only visible on specific tab) */}
      </Animated.View>
    </>
  );
};

export default CustomTabBar;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    overflow: "visible",
  },
  slidingIndicator: {
    backgroundColor: theme.colors.tertiary,
    position: "absolute",
    top: 0,
    height: 3,
    elevation: 3,
  },
  fabContainer: {
    position: "absolute",
    right: theme.paddingHorizontal,
    bottom: TAB_BAR_HEIGHT + theme.gap(5),
    width: theme.gap(12),
    height: theme.gap(12),
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  fab: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}));
