import { TAB_BAR_HEIGHT } from "@/constants/device";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { BackwardIcon } from "react-native-heroicons/solid";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import CustomText from "./CustomText";

const ScreenAppBar = ({ showGoBack, title }) => {
  return (
    <LinearGradient
      colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* 🔹 Left Section (Back Button) */}
      <View style={styles.sideContainer}>
        {showGoBack && router.canGoBack() && (
          <TouchableOpacity
            onPress={() => router.canGoBack()}
            activeOpacity={0.7}
          >
            <BackwardIcon color="white" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* 🔹 Center Title (Always centered) */}
      <View style={styles.titleContainer}>
        <CustomText variant="subtitle1" color="onPrimary" textAlign="center">
          {title}
        </CustomText>
      </View>

      {/* 🔹 Right Side Placeholder (balances layout) */}
      <View style={styles.sideContainer} />
    </LinearGradient>
  );
};

export default ScreenAppBar;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT + rt.insets.top,
    paddingTop: rt.insets.top,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.paddingHorizontal,
    zIndex: 100,
  },
  sideContainer: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: rt.insets.top,
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none", // prevent blocking back button touch
  },
}));
