import CustomText from "@/components/common/CustomText";
import React from "react";
import { Image, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type PurchasedItemProps = {
  item: {
    _id: string | number;
    image: string;
    title: string;
    description: string;
    amount: number;
    quantity: number;
  };
};

const PurchasedItem: React.FC<PurchasedItemProps> = ({ item }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.details}>
        <CustomText variant="label" bold numberOfLines={1}>
          {item.title}
        </CustomText>
        <CustomText variant="small" numberOfLines={2} color="grey500">
          {item.description}
        </CustomText>
        <View style={styles.row}>
          <CustomText variant="body2" bold color="primary">
            KES {item.amount.toFixed(2)}
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
    borderRadius: theme.radii.regular,
    padding: theme.gap(1.5),
    alignItems: "center",
    gap: theme.gap(1.5),
    elevation: 1,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.small,
    backgroundColor: theme.colors.background,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
}));
