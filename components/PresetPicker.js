import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";

const PRESETS = [12, 14, 16, 18, 20, 24];

export default function PresetPicker({ onStart }) {
  const [custom, setCustom] = useState("16");
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Choose a fasting window</Text>
      <View style={styles.row}>
        {PRESETS.map((h) => (
          <Pressable
            key={h}
            onPress={() => onStart(h)}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.chipText}>{h}h</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.customRow}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          keyboardType="numeric"
          placeholder="Hours"
          style={styles.input}
          maxLength={3}
        />
        <Pressable
          onPress={() => onStart(Math.max(1, Number(custom) || 16))}
          style={({ pressed }) => [
            styles.startBtn,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.startText}>Start</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  label: { color: "#A7B0BE", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipText: { color: "#E5E7EB", fontWeight: "700" },
  customRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  startBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  startText: { color: "white", fontWeight: "800" },
});
