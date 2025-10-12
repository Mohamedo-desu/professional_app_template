import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "../common/CustomText";

const OverView = () => {
  const CONTAINER_ITEMS = useMemo(
    () => [
      {
        id: "1",
        title: "Total Sales",
        amount: 2_000,
      },
      {
        id: "2",
        title: "Profit",
        amount: 500,
      },
      {
        id: "3",
        title: "Total Debts",
        amount: 200,
      },
    ],
    []
  );

  return (
    <View style={styles.container}>
      {CONTAINER_ITEMS.map((item) => {
        return (
          <View key={item.id} style={styles.card}>
            <CustomText variant="label" semibold>
              {item.title}
            </CustomText>
            <CustomText variant="subtitle1" bold color="primary">
              KES.{item.amount}
            </CustomText>
          </View>
        );
      })}
    </View>
  );
};

export default OverView;

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: theme.colors.surface,
    gap: theme.gap(2),
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    marginBottom: theme.gap(1),
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.paddingHorizontal,
    width: theme.gap(12),
  },
}));
