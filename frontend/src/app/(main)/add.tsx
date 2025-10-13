import ScreenAppBar from "@/components/common/ScreenAppBar";

import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const AddScreen = () => {
  return (
    <View style={styles.screen}>
      <ScreenAppBar title="Search And Add A Sale Item" showGoBack={true} />
    </View>
  );
};

export default AddScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    position: "relative",
  },
}));
