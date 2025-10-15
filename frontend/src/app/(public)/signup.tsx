import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Input from "@/components/common/Input";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { showToast } from "@/config/toast/ShowToast";
import { ELEVATION } from "@/constants/device";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import z from "zod/v3";

const FULL_NAME = 3;
const PASSWORD_MIN_LENGTH = 8;

export const schema = z.object({
  fullName: z
    .string()
    .min(FULL_NAME, {
      message: `fullName must be at least ${FULL_NAME} characters`,
    })
    .min(1, { message: "fullName is required" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    })
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, {
      message:
        "Password must contain uppercase, lowercase, number, and special character",
    })
    .min(1, { message: "Password is required" }),
});

export type SignUpFormData = z.infer<typeof schema>;

const SignupScreen = () => {
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = useState(false);

  const { isLoaded, signUp } = useSignUp();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: { fullName: "", email: "", password: "" },
    shouldFocusError: true,
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      if (!isLoaded) return;

      Keyboard.dismiss();

      const { fullName, email, password } = data;

      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: {
          fullName,
        },
      });
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      showToast(
        "success",
        "SIGNUP SUCCESS",
        "Check your email to verify your account"
      );
      router.push("/(public)/verification-modal");
    } catch (error: any) {
      console.log("signup error", error);
      showToast(
        "error",
        "SIGNUP FAILED",
        error?.message || "Please check your credentials and try again."
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = Linking.createURL("/(main)/(tabs)");
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });
      if (setActive && createdSessionId) {
        setActive({ session: createdSessionId });
        showToast("success", "LOGIN SUCCESS", "Signed in with Google");
      }
    } catch (error: any) {
      console.error("OAuth error", error);
      showToast(
        "error",
        "LOGIN FAILED",
        error?.message || "An error occurred during Google sign-in"
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
      <ScreenAppBar title="Please signup" showGoBack={true} />
      <View style={styles.body}>
        <LinearGradient
          colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <Input
            label="Full Name"
            control={control}
            errors={errors.fullName}
            name={"fullName"}
            placeholder={"johndoe"}
          />
          <Input
            label="Email"
            control={control}
            errors={errors.email}
            name={"email"}
            placeholder={"johndoe@gmail.com"}
          />
          <Input
            label="Password"
            control={control}
            errors={errors.password}
            name={"password"}
            placeholder={"••••••••••••"}
          />

          <CustomButton
            text={isSubmitting ? "Signing up..." : "Sign Up"}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || isLoading}
          />

          <CustomText variant="subtitle2" color="onPrimary" textAlign="center">
            Or
          </CustomText>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={PRIMARY_COLOR} />
            ) : (
              <View style={styles.gRow}>
                <Ionicons name="logo-google" size={18} color="white" />
                <CustomText
                  variant="button"
                  textAlign="center"
                  color="onPrimary"
                  style={{ marginLeft: 8 }}
                >
                  Continue with Google
                </CustomText>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => router.navigate("/(public)")}
              activeOpacity={0.8}
            >
              <CustomText variant="label" color="onPrimary" textAlign="center">
                Already have an account?
              </CustomText>

              <CustomText
                variant="label"
                color="onPrimary"
                textAlign="center"
                style={{ marginLeft: 4 }}
              >
                Login
              </CustomText>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <CustomText
            variant="label"
            color="onPrimary"
            textAlign="center"
            style={{ flexWrap: "wrap" }}
          >
            By continuing, you agree to our{" "}
          </CustomText>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={() => router.navigate("/(public)/terms")}
              activeOpacity={0.8}
            >
              <CustomText
                variant="label"
                color="onPrimary"
                style={{ textDecorationLine: "underline" }}
              >
                Terms of Service
              </CustomText>
            </TouchableOpacity>

            <CustomText variant="label" color="onPrimary">
              {" "}
              and{" "}
            </CustomText>

            <TouchableOpacity
              onPress={() => router.navigate("/(public)/privacy")}
              activeOpacity={0.8}
            >
              <CustomText
                variant="label"
                color="onPrimary"
                style={{ textDecorationLine: "underline" }}
              >
                Privacy Policy
              </CustomText>
            </TouchableOpacity>
          </View>

          <CustomText
            variant="caption"
            color="onPrimary"
            textAlign="center"
            style={{ marginTop: 6 }}
          >
            App Version 1.0.0
          </CustomText>
        </LinearGradient>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default SignupScreen;

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
    gap: theme.gap(2),
  },
  googleButton: {
    borderRadius: theme.radii.regular,
    backgroundColor: theme.colors.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: theme.gap(10),
  },
  gRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.gap(4),
  },
}));
