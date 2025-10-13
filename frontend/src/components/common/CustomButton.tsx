import { ELEVATION } from "@/constants/device";
import React from "react";
import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "./CustomText";

const CustomButton = ({ text, onPress, style }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.customButton, style]}
      activeOpacity={0.8}
    >
      <CustomText variant="button" textAlign="center" color="onPrimary">
        {text}
      </CustomText>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create((theme) => ({
  customButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    height: theme.gap(10),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.gap(2),
    elevation: ELEVATION,
    width: "100%",
  },
}));
