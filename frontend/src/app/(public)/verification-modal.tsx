import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Input from "@/components/common/Input";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { showToast } from "@/config/toast/ShowToast";
import { ELEVATION } from "@/constants/device";
import { useSignUp } from "@clerk/clerk-expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import { z } from "zod";

export const schema = z.object({
  code: z.string().min(1, { message: "Code is required" }),
});

export type VerificationFormData = z.infer<typeof schema>;

const VerificationModal = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: { code: "" },
    shouldFocusError: true,
  });

  const onSubmit = async (data: VerificationFormData) => {
    try {
      if (!isLoaded) return;

      setIsLoading(true);
      Keyboard.dismiss();

      const { code } = data;
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        showToast(
          "success",
          "VERIFICATION SUCCESS",
          "Your email has been verified!"
        );
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        showToast("error", "VERIFICATION FAILED", "Invalid verification code.");
      }
    } catch (error: any) {
      console.log("Verification error", error);
      showToast(
        "error",
        "VERIFICATION FAILED",
        error?.message || "Please check your verification code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      enableAutomaticScroll
      style={styles.screen}
      contentContainerStyle={styles.contentContainerStyle}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenAppBar title="Verify Email" showGoBack={true} />
      <View style={styles.body}>
        <LinearGradient
          colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <Input
            label="Verification Code"
            control={control}
            errors={errors.code}
            name="code"
            placeholder="Enter your code"
            style={{ fontSize: 18 }}
          />

          <CustomButton
            text={isSubmitting || isLoading ? "Verifying..." : "Verify"}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting || isLoading}
          />

          <CustomText
            variant="small"
            color="onPrimary"
            textAlign="center"
            style={{ marginTop: 16 }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
            {"\n"}App Version 1.0.0
          </CustomText>
        </LinearGradient>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default VerificationModal;

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainerStyle: {
    flex: 1,
    flexGrow: 1,
  },
  body: {
    flex: 1,
    padding: theme.paddingHorizontal,
    gap: theme.gap(5),
  },
  container: {
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    elevation: ELEVATION,
    gap: theme.gap(5),
    justifyContent: "center",
  },
}));
