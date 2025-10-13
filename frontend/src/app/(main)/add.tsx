import SearchItem from "@/components/add-screen/SearchItem";
import ScreenAppBar from "@/components/common/ScreenAppBar";
import { ELEVATION, TAB_BAR_HEIGHT } from "@/constants/device";
import { LegendListRenderItemProps } from "@legendapp/list";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MagnifyingGlassIcon, XCircleIcon } from "react-native-heroicons/solid";
import Animated, { LinearTransition } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";

const data = [
  {
    _id: "1",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31b",
    title: "Sugar (Kabras 2kg)",
    sellingPrice: 100,
    availableStock: 50,
  },
  {
    _id: "2",
    image: "https://images.unsplash.com/photo-1565958011705-44e211fba187",
    title: "Cooking Oil (Salit 1L)",
    sellingPrice: 320,
    availableStock: 30,
  },
  {
    _id: "3",
    image: "https://images.unsplash.com/photo-1606755962773-0e6d0d8c8e23",
    title: "Rice (Sindano 5kg)",
    sellingPrice: 950,
    availableStock: 22,
  },
  {
    _id: "4",
    image: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488",
    title: "Bread (Supaloaf 400g)",
    sellingPrice: 80,
    availableStock: 40,
  },
  {
    _id: "5",
    image: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03",
    title: "Tea Leaves (Kericho Gold 250g)",
    sellingPrice: 180,
    availableStock: 60,
  },
  {
    _id: "6",
    image: "https://images.unsplash.com/photo-1583336663277-620dc1996583",
    title: "Milk (Brookside 500ml)",
    sellingPrice: 65,
    availableStock: 70,
  },
  {
    _id: "7",
    image: "https://images.unsplash.com/photo-1615485290391-5cf81fa7c3b4",
    title: "Wheat Flour (EXE 2kg)",
    sellingPrice: 270,
    availableStock: 45,
  },
  {
    _id: "8",
    image: "https://images.unsplash.com/photo-1611171711913-6630e19d9586",
    title: "Maize Flour (Jogoo 2kg)",
    sellingPrice: 220,
    availableStock: 80,
  },
  {
    _id: "9",
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505",
    title: "Blue Band Margarine 250g",
    sellingPrice: 150,
    availableStock: 25,
  },
  {
    _id: "10",
    image: "https://images.unsplash.com/photo-1583336663277-620dc1996583",
    title: "Fresh Eggs (Tray 30pcs)",
    sellingPrice: 450,
    availableStock: 10,
  },
  {
    _id: "11",
    image: "https://images.unsplash.com/photo-1627328715728-7bcc1b5db87d",
    title: "Salt (Kensalt 1kg)",
    sellingPrice: 35,
    availableStock: 90,
  },
  {
    _id: "12",
    image: "https://images.unsplash.com/photo-1606755962773-0e6d0d8c8e23",
    title: "Rice (Basmati 5kg)",
    sellingPrice: 1250,
    availableStock: 12,
  },
  {
    _id: "13",
    image: "https://images.unsplash.com/photo-1601050690597-23a4c9aa4e0a",
    title: "Detergent (Omo 1kg)",
    sellingPrice: 280,
    availableStock: 34,
  },
  {
    _id: "14",
    image: "https://images.unsplash.com/photo-1600180758890-6cc90e38f6e7",
    title: "Toothpaste (Colgate 100ml)",
    sellingPrice: 120,
    availableStock: 60,
  },
  {
    _id: "15",
    image: "https://images.unsplash.com/photo-1556228724-4c7995313d2d",
    title: "Soap (Menengai Bar 800g)",
    sellingPrice: 160,
    availableStock: 55,
  },
  {
    _id: "16",
    image: "https://images.unsplash.com/photo-1601050690597-23a4c9aa4e0a",
    title: "Washing Powder (Ariel 500g)",
    sellingPrice: 250,
    availableStock: 35,
  },
  {
    _id: "17",
    image: "https://images.unsplash.com/photo-1565958011705-44e211fba187",
    title: "Cooking Oil (Frying 3L)",
    sellingPrice: 880,
    availableStock: 15,
  },
  {
    _id: "18",
    image: "https://images.unsplash.com/photo-1583336663277-620dc1996583",
    title: "Yoghurt (Tuzo 500ml)",
    sellingPrice: 120,
    availableStock: 40,
  },
  {
    _id: "19",
    image: "https://images.unsplash.com/photo-1611171711913-6630e19d9586",
    title: "Maize Flour (Pembe 2kg)",
    sellingPrice: 230,
    availableStock: 70,
  },
  {
    _id: "20",
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505",
    title: "Butter (KCC 250g)",
    sellingPrice: 320,
    availableStock: 25,
  },
];

const AddScreen = () => {
  const [query, setQuery] = useState("");

  const handleClear = () => setQuery("");
  const handleSearch = (text: string) => setQuery(text);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem: React.FC<LegendListRenderItemProps<any>> = ({
    item,
    index,
  }) => <SearchItem item={item} index={index} />;

  return (
    <View style={styles.screen}>
      <ScreenAppBar title="Search And Add A Sale Item" showGoBack={true} />

      <View style={styles.searchContainer}>
        {/* Leading Search Icon */}
        <MagnifyingGlassIcon size={22} color={PRIMARY_COLOR} />

        {/* Text Input */}
        <TextInput
          placeholder="Search for an item..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleSearch}
          style={styles.searchInput}
        />

        {/* Trailing Clear Icon */}
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <XCircleIcon size={20} color={BADGE_COLOR} />
          </TouchableOpacity>
        )}
      </View>
      <Animated.FlatList
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }} // ✅ important
        data={data}
        renderItem={renderItem}
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

export default AddScreen;

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.paddingHorizontal,
    marginVertical: theme.gap(2),
    elevation: ELEVATION,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    marginHorizontal: theme.paddingHorizontal,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.Regular,
    color: theme.colors.onBackground,
    marginLeft: theme.gap(1),
  },
  clearButton: {},
}));
