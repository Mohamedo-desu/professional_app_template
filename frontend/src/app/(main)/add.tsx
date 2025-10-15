import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Input from "@/components/common/Input";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { showToast } from "@/config/toast/ShowToast";
import { ELEVATION, TAB_BAR_HEIGHT } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";

// src/screens/inventory/AddInventoryItemScreen.tsx
import z from "zod/v3";

export const inventorySchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantityAvailable: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Must be a number"
    ),
  costPrice: z
    .string()
    .min(1, "Cost price is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Must be a number"
    ),
  retailPrice: z
    .string()
    .min(1, "Retail price is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Must be a number"
    ),
  wholesalePrice: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Must be a number"
    ),
  unit: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional(),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;

const AddInventoryItemScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addItemToInventory = useMutation(api.dailyEntries.addItemToInventory);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      quantityAvailable: "",
      costPrice: "",
      retailPrice: "",
      wholesalePrice: "",
      unit: "",
      category: "",
      imageUrl:
        "https://images.unsplash.com/photo-1581579186987-2b6a6e0e6a34?w=800",
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      await addItemToInventory({
        name: data.name,
        quantityAvailable: Number(data.quantityAvailable),
        costPrice: Number(data.costPrice),
        retailPrice: Number(data.retailPrice),
        wholesalePrice: Number(data.wholesalePrice || 0),
        unit: data.unit || undefined,
        category: data.category || undefined,
        imageUrl: data.imageUrl || undefined,
      });

      showToast("success", "ITEM ADDED", `${data.name} added to inventory`);
      reset();
    } catch (error: any) {
      console.error(error);
      showToast("error", "FAILED", error?.message || "Could not add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScreenAppBar title="Add Inventory Item" showGoBack />
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
              label="Item Name"
              name="name"
              control={control}
              errors={errors.name}
              placeholder="e.g. 2kg Rice Bag"
            />

            <Input
              label="Quantity Available"
              name="quantityAvailable"
              control={control}
              errors={errors.quantityAvailable}
              keyboardType="numeric"
              placeholder="e.g. 50"
            />

            <Input
              label="Cost Price"
              name="costPrice"
              control={control}
              errors={errors.costPrice}
              keyboardType="numeric"
              placeholder="e.g. 1200"
            />

            <Input
              label="Retail Price"
              name="retailPrice"
              control={control}
              errors={errors.retailPrice}
              keyboardType="numeric"
              placeholder="e.g. 1500"
            />

            <Input
              label="Wholesale Price"
              name="wholesalePrice"
              control={control}
              errors={errors.wholesalePrice}
              keyboardType="numeric"
              placeholder="Optional"
            />

            <Input
              label="Unit"
              name="unit"
              control={control}
              errors={errors.unit}
              placeholder="e.g. kg, pcs, box"
            />

            <Input
              label="Category"
              name="category"
              control={control}
              errors={errors.category}
              placeholder="e.g. Groceries, Drinks"
            />

            <Input
              label="Image URL"
              name="imageUrl"
              control={control}
              errors={errors.imageUrl}
              placeholder="https://example.com/image.jpg"
            />
          </LinearGradient>

          {isSubmitting && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <ActivityIndicator color="white" />
              <CustomText variant="caption" color="onPrimary">
                Saving item...
              </CustomText>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      <View style={styles.AddBtnContainer}>
        <CustomButton
          text={isSubmitting ? "Adding Item..." : "Add Item"}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        />
      </View>
    </>
  );
};

export default AddInventoryItemScreen;

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
