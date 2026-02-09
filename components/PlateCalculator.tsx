// Plate Calculator Component
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { calculatePlates, PlateResult } from '@/lib/utils';

interface PlateCalculatorProps {
  visible: boolean;
  onClose: () => void;
  initialWeight?: number;
  unit?: 'kg' | 'lbs';
}

export default function PlateCalculator({ 
  visible, 
  onClose,
  initialWeight = 60,
  unit = 'kg'
}: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeight.toString());
  const [selectedUnit, setSelectedUnit] = useState(unit);

  const weight = parseFloat(targetWeight) || 0;
  const result = calculatePlates(weight, selectedUnit);

  const getPlateColor = (weight: number): string => {
    if (selectedUnit === 'kg') {
      switch (weight) {
        case 25: return '#ff3b30';
        case 20: return '#007AFF';
        case 15: return '#ffcc00';
        case 10: return '#30d158';
        case 5: return '#fff';
        case 2.5: return '#ff9500';
        case 1.25: return '#8e8e93';
        default: return '#666';
      }
    } else {
      switch (weight) {
        case 45: return '#007AFF';
        case 35: return '#ffcc00';
        case 25: return '#30d158';
        case 10: return '#fff';
        case 5: return '#ff9500';
        case 2.5: return '#8e8e93';
        default: return '#666';
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plate Calculator</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          {/* Weight Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#666"
            />
            
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitButton, selectedUnit === 'kg' && styles.unitButtonActive]}
                onPress={() => setSelectedUnit('kg')}
              >
                <Text style={[styles.unitText, selectedUnit === 'kg' && styles.unitTextActive]}>
                  Kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, selectedUnit === 'lbs' && styles.unitButtonActive]}
                onPress={() => setSelectedUnit('lbs')}
              >
                <Text style={[styles.unitText, selectedUnit === 'lbs' && styles.unitTextActive]}>
                  Lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bar Visualization */}
          <View style={styles.barContainer}>
            <View style={styles.bar}>
              <View style={styles.barEnd} />
              <View style={styles.barMiddle}>
                <Text style={styles.barLabel}>{result.barWeight}{selectedUnit}</Text>
              </View>
              <View style={styles.barEnd} />
            </View>
          </View>

          {/* Plates Per Side */}
          <Text style={styles.sectionTitle}>Plates per side:</Text>
          
          {result.plates.length === 0 ? (
            <View style={styles.emptyPlates}>
              <Text style={styles.emptyText}>
                {weight < result.barWeight 
                  ? `Minimum weight is ${result.barWeight}${selectedUnit} (empty bar)`
                  : 'No plates needed'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.platesList}>
              {result.plates.map((plate, index) => (
                <View key={index} style={styles.plateRow}>
                  <View style={[styles.plateVisual, { backgroundColor: getPlateColor(plate.weight) }]}>
                    <Text style={[
                      styles.plateWeight,
                      plate.weight === 5 && selectedUnit === 'kg' && { color: '#000' },
                      plate.weight === 10 && selectedUnit === 'lbs' && { color: '#000' },
                    ]}>
                      {plate.weight}
                    </Text>
                  </View>
                  <Text style={styles.plateCount}>× {plate.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Weight:</Text>
            <Text style={styles.totalValue}>
              {result.totalWeight} {selectedUnit}
            </Text>
          </View>

          {!result.isAchievable && weight > result.barWeight && (
            <Text style={styles.warningText}>
              ⚠️ Exact weight not achievable with available plates
            </Text>
          )}

          {/* Quick Select */}
          <Text style={styles.sectionTitle}>Quick Select:</Text>
          <View style={styles.quickSelect}>
            {(selectedUnit === 'kg' 
              ? [40, 60, 80, 100, 120, 140] 
              : [95, 135, 185, 225, 275, 315]
            ).map((w) => (
              <TouchableOpacity
                key={w}
                style={styles.quickButton}
                onPress={() => setTargetWeight(w.toString())}
              >
                <Text style={styles.quickButtonText}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'column',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1c1c1e',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  unitTextActive: {
    color: '#fff',
  },
  barContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barEnd: {
    width: 40,
    height: 12,
    backgroundColor: '#666',
    borderRadius: 2,
  },
  barMiddle: {
    width: 180,
    height: 20,
    backgroundColor: '#888',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyPlates: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  platesList: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  plateVisual: {
    width: 60,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateWeight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  plateCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#888',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  warningText: {
    fontSize: 14,
    color: '#ff9500',
    textAlign: 'center',
    marginTop: 12,
  },
  quickSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
  },
  quickButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});
