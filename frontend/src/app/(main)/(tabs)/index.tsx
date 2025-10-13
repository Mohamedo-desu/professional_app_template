import ScreenAppBar from "@/components/common/ScreenAppBar";

import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const HomeScreen = () => {
  return (
    <View style={styles.screen}>
      <ScreenAppBar title="UH&C POS SYSTEM" showGoBack={false} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    position: "relative",
  },
}));
