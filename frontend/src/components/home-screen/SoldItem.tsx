import CustomText from "@/components/common/CustomText";
import { ELEVATION } from "@/constants/device";
import { shortenNumber } from "@/utils/functions";
import React, { useState } from "react";
import { Image, Modal, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";
import CustomButton from "../common/CustomButton";

type SoldItemProps = {
  item: {
    _id?: string | number;
    id?: string | number;
    image?: string;
    title: string;
    description?: string;
    amount?: number; // original item price
    price?: number; // for SaleItem compatibility
    quantity: number;
    total?: number;
    transactionType: string;
  };
};

const SoldItem: React.FC<SoldItemProps> = ({ item }) => {
  const price = item.amount ?? item.price ?? 0;
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  const total = price * quantity;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

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
              item.image || "https://via.placeholder.com/60x60.png?text=Item",
          }}
          style={styles.image}
        />

        <View style={styles.details}>
          <CustomText variant="subtitle2" bold numberOfLines={2}>
            {item.title || "Untitled Item"}
          </CustomText>

          <View style={styles.row}>
            <CustomText variant="body2" bold color="success">
              {shortenNumber(total)}
            </CustomText>
            <CustomText variant="small" color="tertiary">
              × {quantity}
            </CustomText>
          </View>
          <CustomText variant="label" bold numberOfLines={2} color="secondary">
            {item.transactionType || "Cash"}
          </CustomText>
        </View>
      </TouchableOpacity>

      {/* ===== MODAL ===== */}
      <Modal transparent={true} visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Image
              source={{
                uri:
                  item.image ||
                  "https://via.placeholder.com/60x60.png?text=Item",
              }}
              style={styles.modalImage}
            />

            <CustomText variant="subtitle1" bold numberOfLines={2}>
              {item.title || "Untitled Item"}
            </CustomText>

            <CustomText variant="h2" bold color="success">
              {shortenNumber(total)}
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
              text={"Add"}
              onPress={() => {
                // You can handle updating parent store here if needed
                setShowModal(false);
              }}
              style={{
                backgroundColor: PRIMARY_COLOR,
              }}
            />

            <CustomButton
              text={"Cancel"}
              onPress={() => setShowModal(false)}
              style={{
                backgroundColor: BADGE_COLOR,
              }}
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
    height: "70%",
    justifyContent: "space-around",
    alignItems: "center",
    gap: theme.gap(1),
  },
  modalImage: {
    width: "100%",
    height: "40%",
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
