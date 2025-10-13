import CustomText from "@/components/common/CustomText";
import { ELEVATION } from "@/constants/device";
import { shortenNumber } from "@/utils/functions";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type SearchItemProps = {
  item: {
    _id: string;
    image: string;
    title: string;
    sellingPrice: number;
    availableStock: number;
  };
  index: number; // ✅ added index prop
  onPress?: (item: SearchItemProps["item"]) => void;
};

const SearchItem: React.FC<SearchItemProps> = ({ item, index, onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(item)}
        style={styles.touchable}
      >
        <Image
          source={{
            uri:
              item.image || "https://via.placeholder.com/80x80.png?text=Item",
          }}
          style={styles.image}
        />

        <View style={styles.details}>
          <CustomText variant="subtitle2" bold numberOfLines={2}>
            {item.title}
          </CustomText>

          <View style={styles.row}>
            <CustomText variant="body2" bold color="success">
              {shortenNumber(item.sellingPrice)}
            </CustomText>

            <CustomText variant="small" color="tertiary">
              Stock: {item.availableStock}
            </CustomText>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default SearchItem;

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
}));
