// Progress Chart Component - visualize strength gains
import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  unit?: string;
  height?: number;
  color?: string;
}

export default function ProgressChart({ 
  data, 
  title, 
  unit = 'kg',
  height = 200,
  color = '#007AFF'
}: ProgressChartProps) {
  const width = Dimensions.get('window').width - 64; // padding
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data yet</Text>
          <Text style={styles.emptySubtext}>Complete more workouts to see progress</Text>
        </View>
      </View>
    );
  }

  // Calculate bounds
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const valuePadding = valueRange * 0.1;

  // Scale functions
  const xScale = (index: number) => 
    padding.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => 
    padding.top + chartHeight - ((value - minValue + valuePadding) / (valueRange + valuePadding * 2)) * chartHeight;

  // Generate path
  const pathData = data.map((point, i) => {
    const x = xScale(i);
    const y = yScale(point.value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area path (for gradient effect)
  const areaPath = `${pathData} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = [
    { value: minValue, y: yScale(minValue) },
    { value: (minValue + maxValue) / 2, y: yScale((minValue + maxValue) / 2) },
    { value: maxValue, y: yScale(maxValue) },
  ];

  // X-axis labels (first and last date)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Calculate improvement
  const improvement = data.length >= 2 
    ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1)
    : 0;

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {Number(improvement) > 0 && (
          <View style={styles.improvement}>
            <Text style={styles.improvementText}>+{improvement}%</Text>
          </View>
        )}
      </View>

      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke="#333"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <Path
          d={areaPath}
          fill={`${color}20`}
        />

        {/* Line */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
        />

        {/* Data points */}
        {data.map((point, i) => (
          <Circle
            key={i}
            cx={xScale(i)}
            cy={yScale(point.value)}
            r={4}
            fill={color}
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <SvgText
            key={i}
            x={padding.left - 8}
            y={label.y + 4}
            fill="#888"
            fontSize={11}
            textAnchor="end"
          >
            {Math.round(label.value)}
          </SvgText>
        ))}

        {/* X-axis labels */}
        <SvgText
          x={padding.left}
          y={height - 8}
          fill="#888"
          fontSize={11}
          textAnchor="start"
        >
          {formatDate(data[0].date)}
        </SvgText>
        <SvgText
          x={width - padding.right}
          y={height - 8}
          fill="#888"
          fontSize={11}
          textAnchor="end"
        >
          {formatDate(data[data.length - 1].date)}
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Latest: {data[data.length - 1].value} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  improvement: {
    backgroundColor: '#30d15820',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  improvementText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#30d158',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  legend: {
    alignItems: 'center',
    marginTop: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#888',
  },
});
