import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { FlatList, Image, Modal, TouchableOpacity, View } from "react-native";
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
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { ExclamationCircleIcon } from "react-native-heroicons/solid";
import { StyleSheet } from "react-native-unistyles";
import {
  BADGE_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  TERTIARY_COLOR,
} from "unistyles";

// ✅ Schema
const createSaleSchema = (maxQuantity: number) =>
  z.object({
    quantity: z
      .string()
      .min(1, "Quantity is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        "Must be a valid number > 0"
      )
      .refine(
        (val) => Number(val) <= maxQuantity,
        `Quantity cannot exceed available stock`
      ),
    paymentMethod: z.enum(["cash", "mpesa"]),
    soldAsDebt: z.boolean().default(false),
    customerId: z.string().optional(),
  });

export type SaleFormData = z.infer<ReturnType<typeof createSaleSchema>>;

type InventoryItemProps = {
  item: {
    _id: string;
    imageUrl: string;
    name: string;
    retailPrice: number;
    quantityAvailable: number;
    unit?: string;
  };
  index: number;
};

const InventoryItem: React.FC<InventoryItemProps> = ({ item }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // ✅ Handle undefined safely
  const customers = useQuery(api.customers.listCustomers) ?? [];

  console.log({ customers });

  const addSaleForToday = useMutation(api.dailyEntries.addSaleForToday);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(
      createSaleSchema(item.quantityAvailable)
    ) as Resolver<SaleFormData>,
    defaultValues: {
      quantity: "1",
      paymentMethod: "cash",
      soldAsDebt: false,
      customerId: undefined,
    },
  });

  const soldAsDebt = watch("soldAsDebt");

  const onSubmit = async (data: SaleFormData) => {
    try {
      if (!item?._id) throw new Error("Item not selected");

      const quantity = Number(data.quantity);
      if (isNaN(quantity) || quantity <= 0) throw new Error("Invalid quantity");

      const paymentMethod = data.soldAsDebt ? "debt" : data.paymentMethod;

      if (paymentMethod === "debt" && !data.customerId) {
        showToast("error", "NO CUSTOMER", "Please select a customer for debt");
        return;
      }

      await addSaleForToday({
        inventoryId: item._id as Id<"inventory">,
        quantity,
        paymentMethod,
        customerId: data.customerId
          ? (data.customerId as Id<"customers">)
          : undefined,
      });

      showToast(
        "success",
        paymentMethod === "debt" ? "DEBT RECORDED" : "SALE ADDED",
        paymentMethod === "debt"
          ? "Debt recorded successfully!"
          : "Sale added successfully!"
      );

      reset();
      setModalVisible(false);
    } catch (error: any) {
      console.error("Error adding sale or debt:", error);
      showToast("error", "FAILED", error?.message || "Unknown error occurred");
    }
  };

  const COLORS =
    item.quantityAvailable === 0
      ? ([SECONDARY_COLOR, BADGE_COLOR] as const)
      : ([TERTIARY_COLOR, PRIMARY_COLOR] as const);

  return (
    <>
      {/* 🧾 Inventory Card */}
      <LinearGradient
        colors={COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (item.quantityAvailable === 0) {
              showToast(
                "error",
                "OUT OF STOCK",
                `${item.name} is out of stock`
              );
            } else {
              setModalVisible(true);
            }
          }}
          style={styles.touchable}
        >
          <View style={styles.imageContainer}>
            {item.quantityAvailable === 0 ? (
              <ExclamationCircleIcon size={35} color={BADGE_COLOR} />
            ) : (
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    "https://via.placeholder.com/80x80.png?text=Item",
                }}
                style={styles.image}
              />
            )}
          </View>

          <View style={styles.details}>
            <CustomText
              variant="subtitle2"
              bold
              numberOfLines={2}
              color="onPrimary"
            >
              {capitalizeWords(item.name)}
            </CustomText>

            <View style={styles.row}>
              <CustomText variant="body1" bold color="secondary">
                {shortenNumber(item.retailPrice)}
              </CustomText>

              <CustomText variant="small" color="grey400">
                stock: {shortenNumber(item.quantityAvailable)} {item.unit || ""}
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* 💳 Add Sale Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[PRIMARY_COLOR, TERTIARY_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modal}
          >
            <CustomText variant="title" bold color="onPrimary">
              Add Sale - {capitalizeWords(item.name)}
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
            {!soldAsDebt && (
              <>
                {/* Payment Method */}
                <CustomText
                  variant="label"
                  color="onPrimary"
                  semibold
                  style={{ marginTop: 10 }}
                >
                  Payment Method
                </CustomText>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.paymentOptions}>
                      {["cash", "mpesa"].map((method) => (
                        <TouchableOpacity
                          key={method}
                          onPress={() => onChange(method)}
                          style={[
                            styles.paymentButton,
                            value === method && styles.paymentButtonActive,
                          ]}
                        >
                          <CustomText
                            variant="button"
                            semibold
                            style={{
                              color:
                                value === method
                                  ? PRIMARY_COLOR
                                  : styles.paymentButton.borderColor,
                            }}
                          >
                            {method.toUpperCase()}
                          </CustomText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
                {errors.paymentMethod && (
                  <CustomText variant="small" color="error" italic>
                    {errors.paymentMethod.message}
                  </CustomText>
                )}
              </>
            )}

            <Controller
              control={control}
              name="soldAsDebt"
              render={({ field: { value, onChange } }) => (
                <TouchableOpacity
                  style={[styles.debtToggle, value && styles.debtToggleActive]}
                  onPress={() => onChange(!value)}
                >
                  <CustomText variant="label" color="onPrimary" semibold>
                    {value ? "Selected as debt" : "select as debt"}
                  </CustomText>
                </TouchableOpacity>
              )}
            />

            {/* Customer Selection if sold as debt */}
            {soldAsDebt && (
              <View style={{ marginTop: 10 }}>
                <CustomButton
                  text="Select Customer"
                  onPress={() => setCustomerModalVisible(true)}
                  style={{ backgroundColor: SECONDARY_COLOR }}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <CustomButton
                text="Add Sale"
                onPress={handleSubmit(onSubmit)}
                style={{ backgroundColor: SECONDARY_COLOR }}
              />
              <CustomButton
                text="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  reset();
                }}
                style={{ backgroundColor: BADGE_COLOR }}
              />
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Customer Selection Modal */}
      {/* 🧍 Customer Selection Modal */}
      <Modal visible={customerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.customerModal}>
            <CustomText
              variant="title"
              bold
              color="primary"
              style={{ marginBottom: 10 }}
            >
              Select Customer
            </CustomText>

            {/* 🔍 Search Bar */}

            {customers.length > 0 ? (
              <View style={{ maxHeight: 400, width: "100%" }}>
                <FlatList
                  data={customers}
                  keyExtractor={(cust) => cust._id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: cust }) => {
                    const isSelected = selectedCustomer?._id === cust._id;
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCustomer(cust);
                          setValue("customerId", cust._id);
                          setCustomerModalVisible(false);
                          showToast(
                            "success",
                            "Customer Selected",
                            cust.fullName
                          );
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.customerCard,
                          isSelected && styles.customerCardSelected,
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <CustomText
                            variant="subtitle2"
                            bold
                            color={isSelected ? "onPrimary" : "primary"}
                          >
                            {capitalizeWords(cust.fullName)}
                          </CustomText>
                          {isSelected && (
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: SECONDARY_COLOR,
                              }}
                            />
                          )}
                        </View>

                        {cust.phoneNumber && (
                          <CustomText variant="small" color="grey400">
                            📞 {cust.phoneNumber}
                          </CustomText>
                        )}

                        {"balance" in cust && (
                          <CustomText variant="small" color="secondary">
                            Balance: {shortenNumber(cust.balance || 0)}
                          </CustomText>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            ) : (
              <View style={{ marginTop: 20, alignItems: "center" }}>
                <CustomText variant="body1" color="grey400">
                  No customers found.
                </CustomText>
                <CustomButton
                  text="Add Customer"
                  onPress={() => {
                    setCustomerModalVisible(false);
                    router.navigate("/(main)/add-customer");
                  }}
                  style={{ backgroundColor: SECONDARY_COLOR, marginTop: 15 }}
                />
              </View>
            )}

            {/* Footer Buttons */}
            <CustomButton
              text="Close"
              onPress={() => setCustomerModalVisible(false)}
              style={{ backgroundColor: BADGE_COLOR }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default InventoryItem;

// ✅ Styles
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    elevation: ELEVATION,
    overflow: "hidden",
  },
  touchable: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
    height: theme.gap(18),
    padding: theme.paddingHorizontal,
  },
  imageContainer: {
    height: "100%",
    aspectRatio: 1,
    borderRadius: theme.radii.small,
    backgroundColor: theme.colors.background,
    elevation: ELEVATION,
    justifyContent: "center",
    alignItems: "center",
  },
  image: { height: "100%", width: "100%" },
  details: { flex: 1, gap: theme.gap(0.5) },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.gap(0.3),
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
    gap: theme.gap(1),
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
  paymentButtonActive: { backgroundColor: theme.colors.onPrimary },
  modalActions: { marginTop: theme.gap(5), gap: theme.gap(1) },
  debtToggle: {
    marginTop: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.radii.regular,
    padding: theme.gap(1.5),
    alignItems: "center",
  },
  debtToggleActive: { backgroundColor: theme.colors.success },
  customerModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    elevation: ELEVATION,
    width: "90%",
    gap: theme.gap(1),
  },
  customerItem: {
    padding: theme.gap(1.5),
    borderBottomWidth: 1,
    borderColor: theme.colors.grey300,
  },
  customerItemSelected: { backgroundColor: theme.colors.grey200 },
  customerCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  customerCardSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
}));
