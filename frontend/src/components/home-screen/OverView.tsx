import { ELEVATION } from "@/constants/device";
import { useDailyEntryStore } from "@/store/useDailyEntry";
import { shortenNumber } from "@/utils/functions";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR, TERTIARY_COLOR } from "unistyles";
import CustomButton from "../common/CustomButton";
import CustomText from "../common/CustomText";

const OverView = () => {
  const { currentEntry } = useDailyEntryStore();
  const totalSales =
    currentEntry?.sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
  const totalDebts =
    currentEntry?.debts?.reduce((sum, d) => sum + (d.totalOwed || 0), 0) || 0;

  const profit = totalSales - totalDebts;

  const CONTAINER_ITEMS = useMemo(
    () => [
      {
        id: "1",
        title: "Total Sales",
        amount: 10000,
      },
      {
        id: "2",
        title: "Profit",
        amount: 5200,
      },
    ],
    []
  );

  return (
    <View style={styles.OverviewWrapper}>
      <LinearGradient
        colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {CONTAINER_ITEMS.map((item) => {
          return (
            <View key={item.id} style={styles.card}>
              <CustomText variant="subtitle2" semibold>
                {item.title}
              </CustomText>
              <CustomText
                variant="headline"
                bold
                color={item.id === "2" ? "success" : "primary"}
              >
                {shortenNumber(item.amount)}
              </CustomText>
            </View>
          );
        })}
      </LinearGradient>
      <CustomButton
        text={"Close For Today"}
        onPress={() => undefined}
        style={{ backgroundColor: BADGE_COLOR }}
      />
    </View>
  );
};

export default OverView;

const styles = StyleSheet.create((theme) => ({
  OverviewWrapper: {
    marginVertical: theme.gap(1),
    gap: theme.gap(1),
  },
  container: {
    flexWrap: "wrap",
    backgroundColor: theme.colors.surface,
    gap: theme.gap(2),
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    height: theme.gap(30),
    elevation: ELEVATION,
    borderWidth: 1,
    borderColor: theme.colors.tertiary + "22",
    borderCurve: "circular",
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.paddingHorizontal,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}));
