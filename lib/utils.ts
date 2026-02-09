// Utility functions for Forma

// ============================================
// 1RM Calculator (Epley formula)
// ============================================
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) reps = 12; // Cap at 12 for accuracy
  return Math.round(weight * (1 + reps / 30));
}

export function calculateWorkingWeight(oneRepMax: number, targetReps: number): number {
  // Inverse of Epley formula
  return Math.round(oneRepMax / (1 + targetReps / 30));
}

// Percentage-based recommendations
export function getPercentageOfMax(oneRepMax: number, percentage: number): number {
  return Math.round(oneRepMax * (percentage / 100));
}

// ============================================
// Plate Calculator
// ============================================
const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const AVAILABLE_PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const BAR_WEIGHT_KG = 20;
const BAR_WEIGHT_LBS = 45;

export interface PlateResult {
  plates: { weight: number; count: number }[];
  totalWeight: number;
  barWeight: number;
  isAchievable: boolean;
}

export function calculatePlates(
  targetWeight: number, 
  unit: 'kg' | 'lbs' = 'kg'
): PlateResult {
  const barWeight = unit === 'kg' ? BAR_WEIGHT_KG : BAR_WEIGHT_LBS;
  const availablePlates = unit === 'kg' ? AVAILABLE_PLATES_KG : AVAILABLE_PLATES_LBS;
  
  if (targetWeight < barWeight) {
    return {
      plates: [],
      totalWeight: barWeight,
      barWeight,
      isAchievable: false,
    };
  }

  const weightPerSide = (targetWeight - barWeight) / 2;
  const plates: { weight: number; count: number }[] = [];
  let remaining = weightPerSide;

  for (const plateWeight of availablePlates) {
    if (remaining >= plateWeight) {
      const count = Math.floor(remaining / plateWeight);
      plates.push({ weight: plateWeight, count });
      remaining -= count * plateWeight;
    }
  }

  const achievedPerSide = plates.reduce((sum, p) => sum + p.weight * p.count, 0);
  const totalWeight = barWeight + achievedPerSide * 2;

  return {
    plates,
    totalWeight,
    barWeight,
    isAchievable: Math.abs(remaining) < 0.01,
  };
}

// ============================================
// Time Formatting
// ============================================
export function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseRestTime(timeStr: string): number {
  // Parse "1:30" or "90s" or "90"
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
  }
  return parseInt(timeStr.replace('s', '')) || 90;
}

// ============================================
// Weight Conversion
// ============================================
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

// ============================================
// Statistics
// ============================================
export function calculateVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
}

export function getPersonalRecord(
  history: { weight: number; reps: number; date: string }[]
): { weight: number; reps: number; date: string } | null {
  if (history.length === 0) return null;
  
  // Find highest estimated 1RM
  let best = history[0];
  let best1RM = calculate1RM(best.weight, best.reps);
  
  for (const entry of history) {
    const est1RM = calculate1RM(entry.weight, entry.reps);
    if (est1RM > best1RM) {
      best = entry;
      best1RM = est1RM;
    }
  }
  
  return best;
}
