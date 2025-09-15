// components/DailyFastingChart.js
import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function DailyFastingChart({ labels, data }) {
  const chartConfig = {
    backgroundColor: "#0B1220",
    backgroundGradientFrom: "#0B1220",
    backgroundGradientTo: "#0B1220",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(147, 197, 253, ${opacity})`, // bars
    labelColor: (opacity = 1) => `rgba(199, 210, 254, ${opacity})`,
    propsForBackgroundLines: { stroke: "#1F2937" },
    barPercentage: 0.5,
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hours fasted per day</Text>
      <BarChart
        data={{ labels, datasets: [{ data }] }}
        width={screenWidth - 32}
        height={220}
        fromZero
        withInnerLines
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisSuffix="h"
        segments={4}
        showValuesOnTopOfBars={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 8 },
  title: { color: "#E5E7EB", marginBottom: 8, fontWeight: "700" },
  chart: { borderRadius: 12 },
});
