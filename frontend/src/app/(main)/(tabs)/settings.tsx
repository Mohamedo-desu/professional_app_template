import ScreenAppBar from "@/components/common/ScreenAppBar";

import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const SettingsScreen = () => {
  return (
    <View style={styles.screen}>
      <ScreenAppBar title="Manage Your Shop" />
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    position: "relative",
  },
}));
