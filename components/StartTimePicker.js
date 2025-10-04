// File: components/StartTimePicker.js
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

export default function StartTimePicker({ value, onChange }) {
  const [show, setShow] = useState(null); // null | 'date' | 'time'

  const applyDate = (picked) => {
    // keep time from current value
    const keep = dayjs(value);
    const merged = dayjs(picked)
      .hour(keep.hour())
      .minute(keep.minute())
      .second(0)
      .millisecond(0)
      .toDate();
    onChange(merged);
  };

  const applyTime = (picked) => {
    // keep date from current value
    const keep = dayjs(value);
    const pickedTime = dayjs(picked);
    const merged = keep
      .hour(pickedTime.hour())
      .minute(pickedTime.minute())
      .second(0)
      .millisecond(0)
      .toDate();
    onChange(merged);
  };

  const onChangeDate = (event, selected) => {
    if (Platform.OS === "android") setShow(null); // close native dialog
    if (event?.type === "set" && selected) applyDate(selected);
  };

  const onChangeTime = (event, selected) => {
    if (Platform.OS === "android") setShow(null); // close native dialog
    if (event?.type === "set" && selected) applyTime(selected);
  };

  return (
    <View style={{ width: "100%" }}>
      <Text style={styles.label}>When did you start fasting?</Text>

      <View style={styles.row}>
        <Pressable onPress={() => setShow("date")} style={styles.btn}>
          <Text style={styles.btnText}>
            {dayjs(value).format("MMM D, YYYY")}
          </Text>
        </Pressable>
        <Pressable onPress={() => setShow("time")} style={styles.btn}>
          <Text style={styles.btnText}>{dayjs(value).format("h:mm A")}</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(new Date())}
          style={[styles.btn, styles.nowBtn]}
        >
          <Text style={styles.nowText}>Now</Text>
        </Pressable>
      </View>

      {show === "date" && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      {show === "time" && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeTime}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: "#A7B0BE", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  btn: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnText: { color: "#E5E7EB", fontWeight: "700" },
  nowBtn: { backgroundColor: "#E5E7EB" },
  nowText: { color: "#111", fontWeight: "800" },
});
