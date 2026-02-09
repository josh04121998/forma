// 1RM Calculator Component
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { calculate1RM, getPercentageOfMax } from '@/lib/utils';

interface OneRMCalculatorProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialReps?: number;
}

export default function OneRMCalculator({ 
  visible, 
  onClose,
  initialWeight = 100,
  initialReps = 5,
}: OneRMCalculatorProps) {
  const [weight, setWeight] = useState(initialWeight.toString());
  const [reps, setReps] = useState(initialReps.toString());

  const weightNum = parseFloat(weight) || 0;
  const repsNum = parseInt(reps) || 0;
  const estimated1RM = calculate1RM(weightNum, repsNum);

  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50];
  const repRanges: Record<number, string> = {
    100: '1',
    95: '2-3',
    90: '3-4',
    85: '5-6',
    80: '7-8',
    75: '9-10',
    70: '11-12',
    65: '13-15',
    60: '15-18',
    55: '18-20',
    50: '20+',
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>1RM Calculator</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Enter the weight and reps you lifted to estimate your one-rep max.
          </Text>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
            
            <Text style={styles.forText}>for</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputUnit}>reps</Text>
            </View>
          </View>

          {/* Result */}
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Estimated 1RM</Text>
            <Text style={styles.resultValue}>{estimated1RM} kg</Text>
            <Text style={styles.resultNote}>
              Using Epley formula (most accurate for 1-12 reps)
            </Text>
          </View>

          {/* Percentage Table */}
          <Text style={styles.sectionTitle}>Training Weights</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>%</Text>
              <Text style={styles.tableHeaderText}>Weight</Text>
              <Text style={styles.tableHeaderText}>Rep Range</Text>
            </View>
            
            {percentages.map((pct) => {
              const pctWeight = getPercentageOfMax(estimated1RM, pct);
              const isHighlight = pct === 85 || pct === 75; // Common training zones
              
              return (
                <View 
                  key={pct} 
                  style={[styles.tableRow, isHighlight && styles.tableRowHighlight]}
                >
                  <Text style={styles.tableCell}>{pct}%</Text>
                  <Text style={[styles.tableCell, styles.tableCellBold]}>
                    {pctWeight} kg
                  </Text>
                  <Text style={styles.tableCell}>{repRanges[pct]}</Text>
                </View>
              );
            })}
          </View>

          {/* Quick Reference */}
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color="#ffcc00" />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Strength training:</Text> 80-90% for 3-6 reps{'\n'}
              <Text style={styles.tipBold}>Hypertrophy:</Text> 65-80% for 8-12 reps{'\n'}
              <Text style={styles.tipBold}>Endurance:</Text> 50-65% for 15+ reps
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 15,
    color: '#888',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  forText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: '#007AFF20',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultLabel: {
    fontSize: 15,
    color: '#007AFF',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  table: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2e',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  tableRowHighlight: {
    backgroundColor: '#007AFF10',
  },
  tableCell: {
    flex: 1,
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
  },
  tableCellBold: {
    fontWeight: '600',
    color: '#fff',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },
  tipBold: {
    fontWeight: '600',
    color: '#ccc',
  },
});
