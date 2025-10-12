import CustomText from "@/components/common/CustomText";
import React from "react";
import { Image, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type PurchasedItemProps = {
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
  };
};

const PurchasedItem: React.FC<PurchasedItemProps> = ({ item }) => {
  const price = item.amount ?? item.price ?? 0;
  const total = item.total ?? price * item.quantity;

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: item.image || "https://via.placeholder.com/60x60.png?text=Item",
        }}
        style={styles.image}
      />

      <View style={styles.details}>
        <CustomText variant="label" bold numberOfLines={1}>
          {item.title || "Untitled Item"}
        </CustomText>

        {item.description ? (
          <CustomText variant="small" numberOfLines={2} color="grey500">
            {item.description}
          </CustomText>
        ) : null}

        <View style={styles.row}>
          <CustomText variant="body2" bold color="primary">
            KES {total.toFixed(2)}
          </CustomText>
          <CustomText variant="small" color="secondary">
            × {item.quantity}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

export default PurchasedItem;

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.large,
    padding: theme.gap(1.5),
    alignItems: "center",
    gap: theme.gap(1.5),
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
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
}));
