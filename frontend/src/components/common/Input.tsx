import React, { FC } from "react";
import { Control, Controller, FieldErrors, FieldValues } from "react-hook-form";
import {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import CustomText from "./CustomText";

interface InputProps<T extends FieldValues = any>
  extends Pick<TextInputProps, "keyboardType" | "secureTextEntry" | "style"> {
  control: Control<T>;
  name: string;
  label?: string;
  placeholder?: string;
  errors?: FieldErrors<T>[keyof T];
}

const TextInputUnistyles = withUnistyles(TextInput, (theme) => ({
  placeholderTextColor: theme.colors.grey400,
  cursorColor: theme.colors.primary,
}));

const Input: FC<InputProps> = ({
  control,
  errors,
  label,
  name,
  placeholder,
  secureTextEntry,
  keyboardType,
  style,
}) => {
  if (!control) {
    throw new Error("Control prop is required for Input component");
  }

  return (
    <View style={styles.inputContainer}>
      {label && (
        <CustomText
          style={styles.inputLabel}
          variant="label"
          color="onPrimary"
          semibold
        >
          {label}
        </CustomText>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInputUnistyles
            style={[
              styles.input,
              errors?.message && { borderColor: "#f87171", borderWidth: 1 },
              style as StyleProp<TextStyle>,
            ]}
            placeholder={placeholder}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
          />
        )}
      />
      {errors?.message && (
        <CustomText
          style={styles.errorLabel}
          variant="small"
          color="error"
          italic
        >
          {String(errors.message)}
        </CustomText>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create((theme) => ({
  inputContainer: {},
  inputLabel: {
    marginBottom: theme.gap(2),
  },
  input: {
    backgroundColor: theme.colors.surface,
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    color: theme.colors.onSurface,
    fontFamily: theme.fonts.Regular,
    fontSize: 14,
  },
  errorLabel: {
    marginTop: theme.gap(2),
  },
}));
