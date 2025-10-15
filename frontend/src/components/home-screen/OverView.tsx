import { ELEVATION } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { shortenNumber } from "@/utils/functions";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  BADGE_COLOR,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  TERTIARY_COLOR,
} from "unistyles";
import CustomButton from "../common/CustomButton";
import CustomText from "../common/CustomText";

type OverViewProps = {
  summary?: {
    cash: number;
    mpesa: number;
    sales: number;
    profit: number;
  } | null;
  isClosed?: boolean;
  todayEntryId: Id<"dailyEntries">;
};

const OverView = ({ summary, isClosed, todayEntryId }: OverViewProps) => {
  const CONTAINER_ITEMS = useMemo(
    () => [
      { id: "1", title: "Cash Sales", amount: summary?.cash || 0 },
      { id: "2", title: "M-Pesa Sales", amount: summary?.mpesa || 0 },
      { id: "3", title: "Total Sales", amount: summary?.sales || 0 },
      { id: "4", title: "Profit", amount: summary?.profit || 0 },
    ],
    [summary]
  );

  const closeTodayEntry = useMutation(api.dailyEntries.closeEntry);
  const reopenTodayEntry = useMutation(api.dailyEntries.reopenEntry);

  const handleClose = async () => {
    await closeTodayEntry({ entryId: todayEntryId });
  };

  const handleReopen = async () => {
    await reopenTodayEntry({ entryId: todayEntryId });
  };

  return (
    <View style={styles.OverviewWrapper}>
      <LinearGradient
        colors={[TERTIARY_COLOR, PRIMARY_COLOR]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        {CONTAINER_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <CustomText variant="subtitle2" semibold>
              {item.title}
            </CustomText>
            <CustomText
              variant="headline"
              bold
              style={{ color: item.id === "4" ? "#8bce38" : "primary" }}
            >
              {shortenNumber(item.amount)}
            </CustomText>
          </View>
        ))}
      </LinearGradient>

      <CustomButton
        text={isClosed ? "Reopen Day" : "Close For Today"}
        onPress={isClosed ? handleReopen : handleClose}
        style={{
          backgroundColor: isClosed ? BADGE_COLOR : SECONDARY_COLOR,
        }}
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    gap: theme.gap(2),
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    minHeight: theme.gap(25),
    elevation: ELEVATION,
    borderWidth: 1,
    borderColor: theme.colors.tertiary + "22",
    borderCurve: "circular",
  },
  card: {
    flexBasis: "48%",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    paddingVertical: theme.gap(2),
    justifyContent: "center",
    alignItems: "center",
  },
}));
