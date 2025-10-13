import { TAB_BAR_HEIGHT } from "@/constants/device";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ShoppingBagIcon } from "react-native-heroicons/solid";
import Animated from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const AddSaleItemFab = () => {
  return (
    <Animated.View style={styles.fabContainer}>
      <TouchableOpacity
        onPress={() => router.navigate("/(main)/add")}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <ShoppingBagIcon size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default AddSaleItemFab;

const styles = StyleSheet.create((theme, rt) => ({
  fabContainer: {
    position: "absolute",
    right: theme.paddingHorizontal,
    bottom: TAB_BAR_HEIGHT + theme.gap(10), // lift it above the tab bar
  },
  fab: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}));
