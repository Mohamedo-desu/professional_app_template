import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import ScrollToTopFab from "@/components/common/ScrollToTopFab";
import OverView from "@/components/home-screen/OverView";
import PurchasedItem from "@/components/home-screen/PurchasedItem";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { format } from "date-fns";
import React, { FC, useCallback, useContext, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

const data = [
  {
    _id: "1",
    image: "https://images.unsplash.com/photo-1585386959984-a41552231693",
    title: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones with 30hr battery life.",
    amount: 4200,
    quantity: 1,
  },
  {
    _id: "2",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
    title: "Smartwatch Series 8",
    description: "Track your workouts, heart rate, and sleep in style.",
    amount: 26500,
    quantity: 1,
  },
  {
    _id: "3",
    image: "https://images.unsplash.com/photo-1580910051074-4f9c4ae1d6f2",
    title: "Bluetooth Speaker",
    description: "Compact, waterproof, and great for outdoor parties.",
    amount: 5800,
    quantity: 2,
  },
  {
    _id: "4",
    image: "https://images.unsplash.com/photo-1609941675128-92a1e9a963dc",
    title: "Laptop Stand",
    description: "Ergonomic aluminum stand for laptops up to 17 inches.",
    amount: 3500,
    quantity: 1,
  },
  {
    _id: "5",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
    title: "USB-C Cable (1.5m)",
    description: "Durable braided cable for charging and data transfer.",
    amount: 900,
    quantity: 3,
  },
];

const HomeScreen = () => {
  const scrollY = useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderItem: React.FC<LegendListRenderItemProps<any>> = ({ item }) => (
    <PurchasedItem item={item} />
  );

  const handleClose = () => {
    try {
    } catch (error) {}
  };
  return (
    <View style={styles.screen}>
      {/* Today*/}
      <CustomText variant="subtitle1" bold textAlign="center">
        {format(new Date(), "EEEE, do MMMM, yyyy")}
      </CustomText>
      {/* OverView */}
      <OverView />
      {/* Close Btn */}
      <CustomButton text="Close for today" onPress={handleClose} />
      {/* List Items */}
      <AnimatedLegendList
        ref={listRef}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={data}
        renderItem={
          renderItem as FC<
            LegendListRenderItemProps<unknown, string | undefined>
          >
        }
        onScroll={scrollHandler}
        scrollEventThrottle={8}
        onEndReached={() => undefined}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
      />
      {/* Scroll to Top */}
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
    gap: theme.gap(1),
  },
  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(1),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
    paddingTop: theme.gap(1),
  },
}));
