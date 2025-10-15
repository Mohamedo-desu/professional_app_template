import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Image, Modal, TouchableOpacity, View } from "react-native";
import * as z from "zod";

import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import Input from "@/components/common/Input";
import { showToast } from "@/config/toast/ShowToast";
import { ELEVATION } from "@/constants/device";
import { Fonts } from "@/constants/Fonts";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { capitalizeWords, shortenNumber } from "@/utils/functions";
import { useMutation } from "convex/react";
import { XCircleIcon } from "react-native-heroicons/solid";
import { StyleSheet } from "react-native-unistyles";
import {
  BADGE_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  TERTIARY_COLOR,
} from "unistyles";

// ✅ Schema for updating sold quantity
const soldItemSchema = z.object({
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Must be a valid number > 0"
    ),
  paymentMethod: z.enum(["cash", "mpesa"]),
});

export type SoldFormData = z.infer<typeof soldItemSchema>;

type SoldItemProps = {
  item: {
    _id: string;
    dailyEntryId: string;
    inventoryId: string;
    itemName: string;
    paymentMethod: "cash" | "mpesa";
    quantitySold: number;
    totalAmount: number;
    totalProfit: number;
    imageUrl?: string;
  };
};

const SoldItem: React.FC<SoldItemProps> = ({ item }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const addSaleForToday = useMutation(api.dailyEntries.addSaleForToday);
  const deleteSale = useMutation(api.dailyEntries.deleteSale);

  const handleDeleteItem = async () => {
    await deleteSale({
      saleId: item._id as Id<"sales">,
    });
  };
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SoldFormData>({
    resolver: zodResolver(soldItemSchema),
    defaultValues: {
      quantity: String(item.quantitySold),
      paymentMethod: item.paymentMethod,
    },
  });

  const onSubmit = async (data: SoldFormData) => {
    try {
      if (!item.inventoryId) throw new Error("Inventory ID is missing.");

      await addSaleForToday({
        inventoryId: item.inventoryId as Id<"inventory">,
        quantity: Number(data.quantity),
        paymentMethod: data.paymentMethod,
      });

      showToast("success", "SUCCESS", "Sale updated successfully!");
      setModalVisible(false);
      reset();
    } catch (error: any) {
      console.error("Failed to add sale:", error);
      showToast("error", "FAILED", error?.message || "Something went wrong.");
    }
  };

  return (
    <>
      {/* 💵 Sold Item Card */}
      <LinearGradient
        colors={["#FFFFFF", "#EDEDED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onLongPress={() => setModalVisible(true)}
        >
          <Image
            source={{
              uri:
                item.imageUrl ||
                "https://via.placeholder.com/60x60.png?text=Item",
            }}
            style={styles.image}
          />

          <View style={styles.details}>
            <CustomText
              variant="subtitle2"
              bold
              numberOfLines={2}
              color="primary"
            >
              {capitalizeWords(item.itemName)}
            </CustomText>

            <View style={styles.row}>
              <CustomText variant="body1" bold color="success">
                {shortenNumber(item.totalAmount)}
              </CustomText>
              <CustomText variant="small" color="tertiary">
                × {item.quantitySold}
              </CustomText>
            </View>
            <CustomText variant="label" bold color="secondary">
              {item.paymentMethod.toUpperCase()}
            </CustomText>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* 🧾 Update Sale Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modal}
          >
            <TouchableOpacity
              style={{ alignSelf: "flex-end" }}
              onPress={() => {
                setModalVisible(false);
                reset();
              }}
            >
              <XCircleIcon size={24} color={BADGE_COLOR} />
            </TouchableOpacity>
            <CustomText variant="title" bold color="onPrimary">
              Update Sale - {capitalizeWords(item.itemName)}
            </CustomText>

            {/* Quantity Field */}
            <Input
              control={control}
              name="quantity"
              label="Quantity"
              placeholder="Enter quantity"
              errors={errors.quantity}
              keyboardType="number-pad"
              style={{ fontSize: 16, fontFamily: Fonts.SemiBold }}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <CustomButton
                text="Save Changes"
                onPress={handleSubmit(onSubmit)}
                style={{ backgroundColor: SECONDARY_COLOR }}
              />
              <CustomButton
                text="Delete This Item"
                style={{ backgroundColor: BADGE_COLOR }}
                onPress={handleDeleteItem}
              />
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </>
  );
};

export default SoldItem;

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: theme.radii.regular,
    height: theme.gap(20),
    elevation: ELEVATION,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
    padding: theme.paddingHorizontal,
  },
  image: {
    height: "100%",
    aspectRatio: 1,
    borderRadius: theme.radii.small,
    backgroundColor: theme.colors.background,
  },
  details: {
    flex: 1,
    gap: theme.gap(0.5),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundOverlay,
    padding: theme.paddingHorizontal,
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    elevation: ELEVATION,
    width: "100%",
    gap: theme.gap(3),
  },
  paymentOptions: {
    flexDirection: "row",
    gap: theme.gap(1),
    marginTop: theme.gap(2),
  },
  paymentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    alignItems: "center",
  },
  paymentButtonActive: {
    backgroundColor: theme.colors.onPrimary,
  },
  modalActions: {
    marginTop: theme.gap(5),
    gap: theme.gap(1),
  },
}));
