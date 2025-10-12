import React from "react";
import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "./CustomText";

const CustomButton = ({ text, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.customButton}
      activeOpacity={0.8}
    >
      <CustomText variant="label" semibold textAlign="center" color="onPrimary">
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
  },
}));
