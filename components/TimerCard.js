import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TimerCard({
  label,
  value,
  sublabel = null,
  light = false,
}) {
  return (
    <View style={[styles.card, light && styles.light]}>
      <Text style={[styles.label, light && styles.labelLight]}>{label}</Text>
      <Text style={[styles.value, light && styles.valueLight]}>{value}</Text>
      {sublabel}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  light: { backgroundColor: "#0B1220", borderWidth: 1, borderColor: "#1F2937" },
  label: { color: "#A7B0BE", fontSize: 14, marginBottom: 6 },
  value: { color: "white", fontWeight: "800", fontSize: 36, letterSpacing: 1 },
  labelLight: { color: "#93A3B6" },
  valueLight: { color: "#DCE5F5" },
});
