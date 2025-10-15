import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import CustomText from "./CustomText";

interface CustomButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const CustomButton = ({
  text,
  onPress,
  style,
  disabled,
}: CustomButtonProps) => {
  return (
    <LinearGradient
      colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[styles.customButton, style]}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <CustomText variant="button" textAlign="center" color="onPrimary">
          {text}
        </CustomText>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default CustomButton;

const styles = StyleSheet.create((theme) => ({
  customButton: {
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    height: theme.gap(10),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.grey400,
    width: "100%",
  },
}));
