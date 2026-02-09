// Rest Timer Component - popup between sets
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Modal, Vibration,
  Animated, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRestTime } from '@/lib/utils';

interface RestTimerProps {
  visible: boolean;
  duration: number; // seconds
  onComplete: () => void;
  onSkip: () => void;
  onAdjust: (newDuration: number) => void;
}

export default function RestTimer({ 
  visible, 
  duration, 
  onComplete, 
  onSkip,
  onAdjust 
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTimeLeft(duration);
      setIsPaused(false);
      progressAnim.setValue(1);
      
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, duration]);

  useEffect(() => {
    if (!visible || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Vibration.vibrate([0, 500, 100, 500]);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, isPaused, onComplete]);

  const adjustTime = (delta: number) => {
    const newTime = Math.max(15, timeLeft + delta);
    setTimeLeft(newTime);
    onAdjust(newTime);
  };

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Rest Timer</Text>
          
          {/* Circular Progress */}
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatRestTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { width: progress }]} />
          </View>

          {/* Adjust Time */}
          <View style={styles.adjustRow}>
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustTime(-15)}
            >
              <Text style={styles.adjustText}>-15s</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.pauseButton}
              onPress={() => setIsPaused(!isPaused)}
            >
              <Ionicons 
                name={isPaused ? 'play' : 'pause'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.adjustButton} 
              onPress={() => adjustTime(15)}
            >
              <Text style={styles.adjustText}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Rest time presets
export const REST_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
  { label: '5min', value: 300 },
];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#888',
    marginBottom: 24,
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  adjustButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
  },
  adjustText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#888',
  },
});
