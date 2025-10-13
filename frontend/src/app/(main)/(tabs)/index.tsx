import ScrollToTopFab from "@/components/common/ScrollToTopFab";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const HomeScreen = () => {
  return (
    <View style={styles.screen}>
      <Text>HomeScreen</Text>
      <ScrollToTopFab />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    paddingVertical: theme.gap(2),
    gap: theme.gap(1),
  },
}));
