import CustomText from "@/components/common/CustomText";
import { ELEVATION } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { shortenNumber } from "@/utils/functions";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import { Image, Modal, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";
import CustomButton from "../common/CustomButton";

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
  onSaleChanged?: () => void; // optional callback to refresh parent list
};

const SoldItem: React.FC<SoldItemProps> = ({ item, onSaleChanged }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(item.quantitySold);

  const addSaleForToday = useMutation(api.dailyEntries.addSaleForToday);
  const decrementSale = useMutation(api.dailyEntries.decrementSale);
  const deleteSale = useMutation(api.dailyEntries.deleteSale);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAdd = async () => {
    try {
      if (!item.inventoryId) throw new Error("Inventory ID is missing.");

      await addSaleForToday({
        inventoryId: item.inventoryId as Id<"inventory">,
        quantity,
        paymentMethod: item.paymentMethod,
      });

      setQuantity(item.quantitySold); // reset after server update
      setShowModal(false);
      onSaleChanged?.();
    } catch (err: any) {
      console.error("Failed to add sale:", err);
    }
  };

  const handleDecrementServer = async () => {
    try {
      await decrementSale({
        saleId: item._id as Id<"sales">,
        quantity: 1, // decrement by 1
      });

      setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
      onSaleChanged?.();
    } catch (err: any) {
      console.error("Failed to decrement sale:", err);
    }
  };

  const handleDeleteServer = async () => {
    try {
      await deleteSale({ saleId: item._id as Id<"sales"> });
      setShowModal(false);
      onSaleChanged?.();
    } catch (err: any) {
      console.error("Failed to delete sale:", err);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.8}
        onLongPress={() => setShowModal(true)}
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
          <CustomText variant="subtitle2" bold numberOfLines={2}>
            {item.itemName}
          </CustomText>

          <View style={styles.row}>
            <CustomText variant="body2" bold color="success">
              {shortenNumber(item.totalAmount)}
            </CustomText>
            <CustomText variant="small" color="tertiary">
              × {quantity}
            </CustomText>
          </View>
          <CustomText variant="label" bold color="secondary">
            {item.paymentMethod.toUpperCase()}
          </CustomText>
        </View>
      </TouchableOpacity>

      {/* ===== MODAL ===== */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  "https://via.placeholder.com/60x60.png?text=Item",
              }}
              style={styles.modalImage}
            />

            <CustomText variant="subtitle1" bold numberOfLines={2}>
              {item.itemName}
            </CustomText>

            <CustomText variant="h2" bold color="success">
              {shortenNumber(item.totalAmount)}
            </CustomText>

            {/* Quantity Counter */}
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={handleDecrement}
              >
                <CustomText variant="h2" bold>
                  −
                </CustomText>
              </TouchableOpacity>

              <CustomText variant="h2" bold>
                {quantity}
              </CustomText>

              <TouchableOpacity
                style={styles.counterButton}
                onPress={handleIncrement}
              >
                <CustomText variant="h2" bold>
                  +
                </CustomText>
              </TouchableOpacity>
            </View>

            <CustomButton
              text="Add/Update Sale"
              onPress={handleAdd}
              style={{ backgroundColor: PRIMARY_COLOR }}
            />
            <CustomButton
              text="Decrement Sale"
              onPress={handleDecrementServer}
              style={{ backgroundColor: "#FFA500" }}
            />
            <CustomButton
              text="Delete Sale"
              onPress={handleDeleteServer}
              style={{ backgroundColor: "#FF4D4D" }}
            />
            <CustomButton
              text="Cancel"
              onPress={() => {
                setQuantity(item.quantitySold);
                setShowModal(false);
              }}
              style={{ backgroundColor: BADGE_COLOR }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SoldItem;

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    alignItems: "center",
    gap: theme.gap(1.5),
    height: theme.gap(20),
    padding: theme.paddingHorizontal,
    elevation: ELEVATION,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
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
    justifyContent: "space-around",
    alignItems: "center",
    gap: theme.gap(1),
  },
  modalImage: {
    width: "100%",
    height: "20%",
    borderRadius: theme.radii.small,
    backgroundColor: theme.colors.background,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(10),
    marginVertical: theme.gap(1),
  },
  counterButton: {
    flex: 1,
    height: theme.gap(10),
    borderRadius: theme.radii.regular,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.grey200,
    elevation: ELEVATION,
  },
}));
