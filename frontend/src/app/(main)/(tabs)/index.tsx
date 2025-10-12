import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { format } from "date-fns";
import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import ScrollToTopFab from "@/components/common/ScrollToTopFab";
import PurchasedItem from "@/components/home-screen/PurchasedItem";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import { useDailyEntryStore } from "@/store/useDailyEntry";
import { TabScrollYContext } from "./_layout";

// ✅ path to your store

const HomeScreen = () => {
  const scrollY = useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    currentEntry,
    startNewDay,
    fetchTodayEntry,
    closeDay,
    reopenDay,
    isDayOpen,
  } = useDailyEntryStore();

  useEffect(() => {
    fetchTodayEntry();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTodayEntry();
    setRefreshing(false);
  }, [fetchTodayEntry]);

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleClose = async () => {
    if (currentEntry?.closed) {
      await reopenDay();
    } else {
      await closeDay();
    }
  };

  // ✅ Use real data
  const salesData = currentEntry?.sales ?? [];
  const totals = currentEntry?.totals ?? { salesTotal: 0, debtsTotal: 0 };
  const profit = totals.salesTotal - totals.debtsTotal;

  const renderItem: React.FC<LegendListRenderItemProps<any>> = ({ item }) => (
    <PurchasedItem item={item} />
  );

  return (
    <View style={styles.screen}>
      {/* 🗓️ Date Header */}
      <CustomText variant="subtitle1" bold textAlign="center">
        {format(new Date(), "EEEE, do MMMM, yyyy")}
      </CustomText>

      {/* 📊 Summary Section */}
      {currentEntry && (
        <View style={styles.summaryCard}>
          <CustomText variant="body1" bold>
            Daily Summary
          </CustomText>

          <View style={styles.summaryRow}>
            <CustomText variant="small" color="grey500">
              Sales Total
            </CustomText>
            <CustomText variant="small" bold color="primary">
              KES {totals.salesTotal.toFixed(2)}
            </CustomText>
          </View>

          <View style={styles.summaryRow}>
            <CustomText variant="small" color="grey500">
              Debts Total
            </CustomText>
            <CustomText variant="small" bold color="error">
              KES {totals.debtsTotal.toFixed(2)}
            </CustomText>
          </View>

          <View style={styles.summaryRow}>
            <CustomText variant="small" color="grey500">
              Profit (Sales - Debts)
            </CustomText>
            <CustomText variant="small" bold color="success">
              KES {profit.toFixed(2)}
            </CustomText>
          </View>
        </View>
      )}

      {/* ✅ Open / Close Button */}
      <CustomButton
        text={currentEntry?.closed ? "Reopen Day" : "Close for Today"}
        onPress={handleClose}
        backgroundColor={currentEntry?.closed ? "grey500" : "primary"}
      />

      {/* 🧾 List of sales items */}
      <AnimatedLegendList
        ref={listRef}
        keyExtractor={(item) => item.id?.toString() || item._id?.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        data={salesData}
        renderItem={
          renderItem as FC<
            LegendListRenderItemProps<unknown, string | undefined>
          >
        }
        onScroll={scrollHandler}
        scrollEventThrottle={8}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        ListEmptyComponent={
          <CustomText textAlign="center" color="grey500" mt={2}>
            {currentEntry?.closed
              ? "Day closed — no sales today."
              : "No sales yet. Add a sale to begin."}
          </CustomText>
        }
      />

      {/* ⬆ Scroll to Top */}
      <ScrollToTopFab onPress={scrollToTop} scrollY={scrollY} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    paddingVertical: theme.gap(2),
    gap: theme.gap(1.5),
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.large,
    padding: theme.gap(1.5),
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.gap(0.5),
  },
  list: {
    flex: 1,
  },
  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(1),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
  },
}));
