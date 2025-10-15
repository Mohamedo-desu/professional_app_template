import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import { ELEVATION } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { shortenNumber } from "@/utils/functions";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import { Image, Modal, TextInput, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type InventoryItemProps = {
  item: {
    _id: string;
    imageUrl: string;
    name: string;
    retailPrice: number;
    quantityAvailable: number;
  };
  index: number;
  onSaleAdded?: () => void;
};

const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  index,
  onSaleAdded,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");

  const addSale = useMutation(api.dailyEntries.addSaleForToday);

  const handleAddSale = async () => {
    try {
      await addSale({
        inventoryId: item._id as Id<"inventory">,
        quantity: Number(quantity),
        paymentMethod,
      });

      setModalVisible(false);
      setQuantity("1");
    } catch (err: any) {
      console.error("Error adding sale:", err);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
          style={styles.touchable}
        >
          <Image
            source={{
              uri:
                item.imageUrl ||
                "https://via.placeholder.com/80x80.png?text=Item",
            }}
            style={styles.image}
          />

          <View style={styles.details}>
            <CustomText variant="subtitle2" bold numberOfLines={2}>
              {item.name}
            </CustomText>

            <View style={styles.row}>
              <CustomText variant="body2" bold color="success">
                {shortenNumber(item.retailPrice)}
              </CustomText>

              <CustomText variant="small" color="tertiary">
                Stock: {item.quantityAvailable} {item.unit || ""}
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 🧾 Add Sale Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <CustomText variant="title" bold>
              Add Sale - {item.name}
            </CustomText>

            <CustomText variant="body1" style={{ marginTop: 10 }}>
              Quantity
            </CustomText>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={styles.input}
            />

            <CustomText variant="body1" style={{ marginTop: 10 }}>
              Payment Method
            </CustomText>
            <View style={styles.paymentOptions}>
              {["cash", "mpesa"].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method as "cash" | "mpesa")}
                  style={[
                    styles.paymentButton,
                    paymentMethod === method && styles.paymentButtonActive,
                  ]}
                >
                  <CustomText
                    variant="body1"
                    style={{
                      color:
                        paymentMethod === method
                          ? "white"
                          : styles.paymentButton.borderColor,
                    }}
                  >
                    {method.toUpperCase()}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <CustomButton text="Add Sale" onPress={handleAddSale} />
              <CustomButton
                text="Cancel"
                onPress={() => setModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default InventoryItem;

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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  paymentOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  paymentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  paymentButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  modalActions: {
    marginTop: 20,
    gap: 10,
  },
}));
