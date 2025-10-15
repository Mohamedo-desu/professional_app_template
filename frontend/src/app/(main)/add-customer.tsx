import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet } from "react-native-unistyles";
import z from "zod/v3";

import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Input from "@/components/common/Input";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { showToast } from "@/config/toast/ShowToast";
import { ELEVATION, TAB_BAR_HEIGHT } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";

//
// 🧾 Schema for adding a customer
//
export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  emailAddress: z.string().email("Invalid email").optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

const AddCustomerScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCustomer = useMutation(api.customers.addCustomer); // ✅ ensure you have this mutation in your convex backend

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phoneNumber: "",
      emailAddress: "",
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      await addCustomer({
        name: data.name,
        phoneNumber: data.phoneNumber,
        emailAddress: data.emailAddress || undefined,
      });

      showToast("success", "CUSTOMER ADDED", `${data.name} added successfully`);
      reset();
    } catch (error: any) {
      console.error(error);
      showToast("error", "FAILED", error?.message || "Could not add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScreenAppBar title="Add Customer" showGoBack />

      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        style={styles.screen}
        contentContainerStyle={styles.contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <LinearGradient
            colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.formContainer}
          >
            <Input
              label="Customer Name"
              name="name"
              control={control}
              errors={errors.name}
              placeholder="e.g. Ali Mohamed"
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              control={control}
              errors={errors.phoneNumber}
              keyboardType="phone-pad"
              placeholder="e.g. 0712345678"
            />

            <Input
              label="Email Address"
              name="emailAddress"
              control={control}
              errors={errors.emailAddress}
              keyboardType="email-address"
              placeholder="e.g. ali@email.com"
            />
          </LinearGradient>

          {isSubmitting && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator color="white" />
              <CustomText variant="caption" color="onPrimary">
                Saving customer...
              </CustomText>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.AddBtnContainer}>
        <CustomButton
          text={isSubmitting ? "Adding..." : "Add Customer"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </View>
    </>
  );
};

export default AddCustomerScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  AddBtnContainer: {
    paddingBottom: rt.insets.bottom,
    padding: theme.paddingHorizontal,
    backgroundColor: theme.colors.surface,
    elevation: ELEVATION,
  },
  contentContainerStyle: {
    flexGrow: 1,
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT,
  },
  body: {
    flex: 1,
    padding: theme.paddingHorizontal,
  },
  formContainer: {
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    elevation: ELEVATION,
    gap: theme.gap(3),
  },
}));
