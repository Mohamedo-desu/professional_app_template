import ScreenAppBar from "@/components/common/ScreenAppBar";
import OverView from "@/components/home-screen/OverView";
import SoldItem from "@/components/home-screen/SoldItem";
import { TAB_BAR_HEIGHT } from "@/constants/device";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const HomeScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  // 🧭 Queries
  const startNewDay = useMutation(api.dailyEntries.startNewDay);
  const todayEntry = useQuery(api.dailyEntries.getTodayDailyEntry);

  // 🎯 Fetch sales linked to today’s entry
  const sales =
    useQuery(api.dailyEntries.getSalesByDailyEntry, {
      dailyEntryId: todayEntry?._id as Id<"dailyEntries">,
    }) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 🧩 Auto-start a new day if none exists
  useEffect(() => {
    if (todayEntry === null) startNewDay();
  }, [todayEntry]);

  const renderItem = ({ item }: any) => <SoldItem item={item} />;

  const summary = useMemo(() => {
    if (!todayEntry) return null;
    return {
      cash: todayEntry.cashTotal,
      mpesa: todayEntry.mpesaTotal,
      sales: todayEntry.salesTotal,
      profit: todayEntry.profitTotal,
    };
  }, [todayEntry]);

  return (
    <View style={styles.screen}>
      <ScreenAppBar title="UH&C POS SYSTEM" showGoBack={false} />

      <Animated.FlatList
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={sales}
        renderItem={renderItem}
        ListHeaderComponent={
          <OverView
            summary={summary}
            isClosed={todayEntry?.closed}
            todayEntryId={todayEntry?._id}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        itemLayoutAnimation={LinearTransition}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: "relative",
  },
  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(2),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
    paddingTop: theme.gap(1),
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
  },
}));
