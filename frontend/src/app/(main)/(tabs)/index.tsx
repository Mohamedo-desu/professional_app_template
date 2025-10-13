import ScreenAppBar from "@/components/common/ScreenAppBar";
import OverView from "@/components/home-screen/OverView";
import SoldItem from "@/components/home-screen/SoldItem";
import { TAB_BAR_HEIGHT } from "@/constants/device";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import React, { useCallback, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const data = [
  {
    _id: "1",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31b",
    title: "Sugar (Kabras 2kg)",
    description: "Premium brown sugar popular in Kenyan households.",
    amount: 320,
    quantity: 50,
    transactionType: "Mpesa",
  },
  {
    _id: "2",
    image: "https://images.unsplash.com/photo-1615486365883-9b92c8f5b2b3",
    title: "Unga wa Dola (2kg)",
    description: "Refined maize flour used for ugali and porridge.",
    amount: 250,
    quantity: 40,
    transactionType: "cash",
  },
  {
    _id: "3",
    image: "https://images.unsplash.com/photo-1590080875831-63b7f3bc473a",
    title: "Pishori Rice (5kg)",
    description: "Fragrant long-grain rice from Mwea.",
    amount: 1200,
    quantity: 20,
    transactionType: "Mpesa",
  },
  {
    _id: "4",
    image: "https://images.unsplash.com/photo-1624716554842-1d4efb6b5e6d",
    title: "Cooking Oil (Fresh Fri 3L)",
    description: "Vegetable oil suitable for deep frying and cooking.",
    amount: 1100,
    quantity: 30,
    transactionType: "cash",
  },
  {
    _id: "5",
    image: "https://images.unsplash.com/photo-1625944230949-08e5f20c7ed8",
    title: "Milk (Brookside 500ml)",
    description: "Fresh pasteurized milk ideal for tea and breakfast.",
    amount: 75,
    quantity: 100,
    transactionType: "Mpesa",
  },
  {
    _id: "6",
    image: "https://images.unsplash.com/photo-1576186726115-4d7453c8b43e",
    title: "Bread (Broadways 400g)",
    description: "Soft, freshly baked white bread loved across Nairobi.",
    amount: 85,
    quantity: 60,
    transactionType: "cash",
  },
  {
    _id: "7",
    image: "https://images.unsplash.com/photo-1615485298852-35f1d441c7b4",
    title: "Tea Leaves (Kericho Gold 250g)",
    description: "Strong Kenyan black tea rich in aroma and flavor.",
    amount: 280,
    quantity: 25,
    transactionType: "Mpesa",
  },
  {
    _id: "8",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f",
    title: "Blue Band Margarine (500g)",
    description: "Popular margarine for bread and cooking.",
    amount: 230,
    quantity: 40,
    transactionType: "cash",
  },
  {
    _id: "9",
    image: "https://images.unsplash.com/photo-1577597532288-6b5c9a9b3e69",
    title: "Salt (Kensalt 1kg)",
    description: "Refined iodized table salt from Kenya.",
    amount: 60,
    quantity: 80,
    transactionType: "cash",
  },
  {
    _id: "10",
    image: "https://images.unsplash.com/photo-1607871441413-2f49c3d4e5de",
    title: "Beans (Njahi 2kg)",
    description: "High-protein traditional black beans.",
    amount: 480,
    quantity: 25,
    transactionType: "Mpesa",
  },
  {
    _id: "11",
    image: "https://images.unsplash.com/photo-1615485298852-35f1d441c7b4",
    title: "Green Grams (Ndengu 2kg)",
    description: "Popular pulses used in Kenyan stews.",
    amount: 450,
    quantity: 30,
    transactionType: "cash",
  },
  {
    _id: "12",
    image: "https://images.unsplash.com/photo-1576186818667-dab350c8c45b",
    title: "Tomatoes (1kg)",
    description: "Fresh red tomatoes from local farms.",
    amount: 180,
    quantity: 50,
    transactionType: "cash",
  },
  {
    _id: "13",
    image: "https://images.unsplash.com/photo-1585059895524-050b3189d5b8",
    title: "Onions (1kg)",
    description: "Red onions for everyday cooking.",
    amount: 130,
    quantity: 50,
    transactionType: "Mpesa",
  },
  {
    _id: "14",
    image: "https://images.unsplash.com/photo-1615937695556-1a9d7f3b872d",
    title: "Potatoes (1kg)",
    description: "Fresh Irish potatoes from Nyandarua.",
    amount: 150,
    quantity: 60,
    transactionType: "cash",
  },
  {
    _id: "15",
    image: "https://images.unsplash.com/photo-1615486365883-9b92c8f5b2b3",
    title: "Cabbage (1 piece)",
    description: "Locally grown fresh cabbage head.",
    amount: 100,
    quantity: 40,
    transactionType: "Mpesa",
  },
  {
    _id: "16",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f",
    title: "Cooking Fat (Kasuku 500g)",
    description: "Affordable alternative to oil for deep frying.",
    amount: 160,
    quantity: 30,
    transactionType: "cash",
  },
  {
    _id: "17",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
    title: "Matchbox (5 pack)",
    description: "Reliable matchsticks for daily use.",
    amount: 60,
    quantity: 100,
    transactionType: "Mpesa",
  },
  {
    _id: "18",
    image: "https://images.unsplash.com/photo-1625944230949-08e5f20c7ed8",
    title: "Royco Mchuzi Mix (200g)",
    description: "Flavor enhancer for soups and stews.",
    amount: 140,
    quantity: 35,
    transactionType: "cash",
  },
  {
    _id: "19",
    image: "https://images.unsplash.com/photo-1575444758702-46a7f1b9349e",
    title: "Toilet Paper (4 rolls)",
    description: "Soft tissue rolls for home and office use.",
    amount: 180,
    quantity: 60,
    transactionType: "Mpesa",
  },
  {
    _id: "20",
    image: "https://images.unsplash.com/photo-1582719478143-e7b85bba3b1b",
    title: "Bar Soap (Menengai 1kg)",
    description: "Multipurpose soap for laundry and cleaning.",
    amount: 250,
    quantity: 40,
    transactionType: "cash",
  },
];

const HomeScreen = () => {
  const listRef = useRef<LegendListRef>(null);
  const [refreshing, setRefreshing] = useState(false);

  const renderItem: React.FC<LegendListRenderItemProps<any>> = ({ item }) => (
    <SoldItem item={item} />
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenAppBar title="UH&C POS SYSTEM" showGoBack={false} />

      <Animated.FlatList
        ref={listRef}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={() => {
          return <OverView />;
        }}
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
  container: {
    paddingHorizontal: theme.paddingHorizontal,
    flex: 1,
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
