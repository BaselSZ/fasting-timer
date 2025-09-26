// components/StartTimePicker.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

export default function StartTimePicker({ value, onChange }) {
  // Local buffered copy so parent re-renders can't overwrite in-progress changes
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("date"); // 'date' | 'time'
  const [temp, setTemp] = useState(() => new Date(value || Date.now()));

  // Keep temp in sync when opening (but don't live-sync while closed)
  const openPicker = () => {
    setTemp(new Date(value || Date.now()));
    setStep("date");
    setOpen(true);
  };

  const commit = () => {
    setOpen(false);
    onChange(temp); // Only commit once here
  };

  const cancel = () => {
    setOpen(false);
  };

  // merge helpers
  const setDatePart = (d) => {
    const t = dayjs(temp);
    const merged = dayjs(d)
      .hour(t.hour())
      .minute(t.minute())
      .second(0)
      .millisecond(0)
      .toDate();
    setTemp(merged);
  };

  const setTimePart = (d) => {
    const v = dayjs(temp);
    const merged = v
      .hour(dayjs(d).hour())
      .minute(dayjs(d).minute())
      .second(0)
      .millisecond(0)
      .toDate();
    setTemp(merged);
  };

  // Android: respect event.type === 'set'
  const onChangeDate = (_event, selected) => {
    if (Platform.OS === "android") {
      // dismissed -> do nothing (stay on modal, keep temp)
      if (_event.type === "set" && selected) {
        setDatePart(selected);
        setStep("time"); // advance to time selection
      }
    } else {
      if (selected) setDatePart(selected); // iOS updates inline
    }
  };

  const onChangeTime = (_event, selected) => {
    if (Platform.OS === "android") {
      if (_event.type === "set" && selected) {
        setTimePart(selected);
      }
    } else {
      if (selected) setTimePart(selected);
    }
  };

  return (
    <View style={{ width: "100%" }}>
      <Text style={styles.label}>When did you start fasting?</Text>

      <View style={styles.row}>
        <Pressable onPress={openPicker} style={styles.btn}>
          <Text style={styles.btnText}>
            {dayjs(value).format("MMM D, YYYY h:mm A")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(new Date())}
          style={[styles.btn, styles.nowBtn]}
        >
          <Text style={styles.nowText}>Now</Text>
        </Pressable>
      </View>

      {/* Buffered modal wrapper so parent re-renders can't reset the in-progress choice */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={cancel}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>
              Pick start {step === "date" ? "date" : "time"}
            </Text>

            {step === "date" ? (
              <DateTimePicker
                value={temp}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            ) : (
              <DateTimePicker
                value={temp}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeTime}
              />
            )}

            <Text style={styles.preview}>
              {dayjs(temp).format("MMM D, YYYY • h:mm A")}
            </Text>

            <View style={styles.actions}>
              {step === "time" ? (
                <>
                  <Pressable
                    onPress={() => setStep("date")}
                    style={[styles.actionBtn, styles.secondary]}
                  >
                    <Text style={styles.secondaryText}>Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={commit}
                    style={[styles.actionBtn, styles.primary]}
                  >
                    <Text style={styles.primaryText}>Apply</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={cancel}
                    style={[styles.actionBtn, styles.secondary]}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setStep("time")}
                    style={[styles.actionBtn, styles.primary]}
                  >
                    <Text style={styles.primaryText}>Next</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "88%",
    backgroundColor: "#0B1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  title: { color: "white", fontWeight: "800", fontSize: 18, marginBottom: 8 },
  preview: { color: "#E5E7EB", textAlign: "center", marginTop: 10 },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    justifyContent: "flex-end",
  },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },

  primary: { backgroundColor: "#2563EB" },
  primaryText: { color: "white", fontWeight: "700" },
  secondary: { backgroundColor: "#E5E7EB" },
  secondaryText: { color: "#111", fontWeight: "700" },
});
