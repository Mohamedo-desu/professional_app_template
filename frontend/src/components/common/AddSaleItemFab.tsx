import { TAB_BAR_HEIGHT } from "@/constants/device";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ShoppingBagIcon } from "react-native-heroicons/solid";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const AddSaleItemFab = () => {
  return (
    <Animated.View
      style={styles.fabContainer}
      entering={ZoomIn}
      exiting={ZoomOut}
    >
      <TouchableOpacity
        onPress={() => router.navigate("/(main)/add")}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <ShoppingBagIcon size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  fabContainer: {
    position: "absolute",
    right: theme.paddingHorizontal,
    bottom: TAB_BAR_HEIGHT + theme.gap(5),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.gap(5),
    width: theme.gap(10),
    height: theme.gap(10),
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  fab: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
}));

export default AddSaleItemFab;
