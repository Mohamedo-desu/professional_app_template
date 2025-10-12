import CustomButton from "@/components/common/CustomButton";
import CustomText from "@/components/common/CustomText";
import { useDailyEntryStore } from "@/store/useDailyEntry";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const AddSaleItemScreen = () => {
  const navigation = useNavigation();
  const { addSale, currentEntry } = useDailyEntryStore();

  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const total = Number(price || 0) * Number(quantity || 0);

  const handleAddItem = async () => {
    if (!title || !price) return alert("Please fill in all fields");
    if (!currentEntry) return alert("Please start a new day first");

    const newItem = {
      id: Math.random().toString(),
      title,
      quantity: Number(quantity),
      price: Number(price),
      total,
    };

    await addSale(newItem);
    alert("✅ Sale item added successfully!");
    navigation.goBack();
  };

  const handleCancel = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <CustomText
        variant="subtitle1"
        bold
        textAlign="center"
        style={styles.header}
      >
        🛒 Add New Sale Item
      </CustomText>

      <View style={styles.form}>
        <CustomText variant="body2" bold>
          Item Name
        </CustomText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Soda 500ml"
          style={styles.input}
        />

        <CustomText variant="body2" bold>
          Quantity
        </CustomText>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
        />

        <CustomText variant="body2" bold>
          Price (KSh)
        </CustomText>
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
        />

        <CustomText variant="body2" bold style={styles.totalLabel}>
          Total:{" "}
          <CustomText variant="body1" bold>
            {total.toFixed(2)} KSh
          </CustomText>
        </CustomText>
      </View>

      <View style={styles.buttons}>
        <CustomButton text="Add Sale Item" onPress={handleAddItem} />
        <CustomButton
          text="Cancel"
          onPress={handleCancel}
          style={styles.cancelButton}
          textStyle={{ color: "white" }}
        />
      </View>
    </View>
  );
};

export default AddSaleItemScreen;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    paddingVertical: theme.gap(2),
  },
  header: {
    marginBottom: theme.gap(2),
  },
  form: {
    gap: theme.gap(1.5),
    marginBottom: theme.gap(3),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: theme.gap(1),
    fontSize: 16,
    backgroundColor: theme.colors.surface,
  },
  totalLabel: {
    marginTop: theme.gap(1),
  },
  buttons: {
    gap: theme.gap(1),
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
}));
