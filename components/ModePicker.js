// components/ModePicker.js
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

const MODES = [
  { label: "12 : 12", hours: 12 },
  { label: "14 : 10", hours: 14 },
  { label: "16 : 8", hours: 16 },
  { label: "18 : 6", hours: 18 },
  { label: "20 : 4", hours: 20 },
  { label: "OMAD", hours: 23 }, // typical eating ~1h
];

export default function ModePicker({ value, onChange }) {
  return (
    <View style={{ width: "100%" }}>
      <Text style={styles.label}>Choose a fasting mode</Text>
      <View style={styles.row}>
        {MODES.map((m) => (
          <Pressable
            key={m.label}
            onPress={() => onChange(m.hours)}
            style={({ pressed }) => [
              styles.chip,
              value === m.hours && styles.active,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.text, value === m.hours && styles.textActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  active: { backgroundColor: "#2563EB" },
  text: { color: "#E5E7EB", fontWeight: "700" },
  textActive: { color: "white" },
  label: { color: "#A7B0BE", marginBottom: 8 },
});
