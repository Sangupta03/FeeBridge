import { sigmoid } from './risk';

export interface TrainingInstance {
  name: string;
  features: {
    latePayments: number;
    overdueMonths: number;
    hadPartialPayment: boolean;
    outstandingAmount: number;
    installmentPlansUsed: number;
    avgDelayDays: number;
    siblings: number;
  };
  defaulted: number; // Binary label: 0 = Paid on time, 1 = Defaulted / Late
}

// 30 base historical seed cases
export const TRAINING_DATA: TrainingInstance[] = [
  { name: "Patel Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 0, installmentPlansUsed: 0, avgDelayDays: 0, siblings: 1 }, defaulted: 0 },
  { name: "D'Souza Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 0, installmentPlansUsed: 0, avgDelayDays: 1, siblings: 1 }, defaulted: 0 },
  { name: "Gupta Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 2000, installmentPlansUsed: 0, avgDelayDays: 0, siblings: 1 }, defaulted: 0 },
  { name: "Shah Family", features: { latePayments: 1, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 0, installmentPlansUsed: 0, avgDelayDays: 2, siblings: 2 }, defaulted: 0 },
  { name: "Sen Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 5000, installmentPlansUsed: 0, avgDelayDays: 1, siblings: 1 }, defaulted: 0 },
  { name: "Rao Family", features: { latePayments: 1, overdueMonths: 0, hadPartialPayment: true, outstandingAmount: 4500, installmentPlansUsed: 0, avgDelayDays: 5, siblings: 1 }, defaulted: 0 },
  { name: "Verma Family", features: { latePayments: 1, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 9000, installmentPlansUsed: 1, avgDelayDays: 7, siblings: 1 }, defaulted: 0 },
  { name: "Nair Family", features: { latePayments: 2, overdueMonths: 0, hadPartialPayment: true, outstandingAmount: 8000, installmentPlansUsed: 1, avgDelayDays: 6, siblings: 2 }, defaulted: 0 },
  { name: "Khan Family", features: { latePayments: 3, overdueMonths: 2, hadPartialPayment: true, outstandingAmount: 24000, installmentPlansUsed: 2, avgDelayDays: 14, siblings: 3 }, defaulted: 1 },
  { name: "Reddy Family", features: { latePayments: 4, overdueMonths: 3, hadPartialPayment: true, outstandingAmount: 30000, installmentPlansUsed: 1, avgDelayDays: 18, siblings: 2 }, defaulted: 1 },
  { name: "Joshi Family", features: { latePayments: 2, overdueMonths: 2, hadPartialPayment: false, outstandingAmount: 18000, installmentPlansUsed: 3, avgDelayDays: 12, siblings: 1 }, defaulted: 1 },
  { name: "Pillai Family", features: { latePayments: 5, overdueMonths: 1, hadPartialPayment: true, outstandingAmount: 15000, installmentPlansUsed: 0, avgDelayDays: 10, siblings: 2 }, defaulted: 1 },
  { name: "Mehta Family", features: { latePayments: 3, overdueMonths: 2, hadPartialPayment: false, outstandingAmount: 21000, installmentPlansUsed: 2, avgDelayDays: 15, siblings: 2 }, defaulted: 1 },
  { name: "Dubey Family", features: { latePayments: 4, overdueMonths: 3, hadPartialPayment: true, outstandingAmount: 28000, installmentPlansUsed: 1, avgDelayDays: 20, siblings: 1 }, defaulted: 1 },
  { name: "Bose Family", features: { latePayments: 0, overdueMonths: 4, hadPartialPayment: true, outstandingAmount: 36000, installmentPlansUsed: 4, avgDelayDays: 11, siblings: 3 }, defaulted: 1 },
  { name: "Singh Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 1500, installmentPlansUsed: 0, avgDelayDays: 0, siblings: 2 }, defaulted: 0 },
  { name: "Chatterjee Family", features: { latePayments: 1, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 3500, installmentPlansUsed: 0, avgDelayDays: 3, siblings: 1 }, defaulted: 0 },
  { name: "Mukherjee Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: true, outstandingAmount: 6000, installmentPlansUsed: 1, avgDelayDays: 2, siblings: 1 }, defaulted: 0 },
  { name: "Mishra Family", features: { latePayments: 2, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 4000, installmentPlansUsed: 1, avgDelayDays: 4, siblings: 2 }, defaulted: 0 },
  { name: "Trivedi Family", features: { latePayments: 1, overdueMonths: 1, hadPartialPayment: true, outstandingAmount: 11000, installmentPlansUsed: 2, avgDelayDays: 8, siblings: 3 }, defaulted: 1 },
  { name: "Pandey Family", features: { latePayments: 3, overdueMonths: 1, hadPartialPayment: true, outstandingAmount: 13000, installmentPlansUsed: 1, avgDelayDays: 9, siblings: 1 }, defaulted: 1 },
  { name: "Vyas Family", features: { latePayments: 4, overdueMonths: 2, hadPartialPayment: false, outstandingAmount: 22000, installmentPlansUsed: 2, avgDelayDays: 16, siblings: 2 }, defaulted: 1 },
  { name: "Dixit Family", features: { latePayments: 5, overdueMonths: 3, hadPartialPayment: true, outstandingAmount: 32000, installmentPlansUsed: 3, avgDelayDays: 25, siblings: 1 }, defaulted: 1 },
  { name: "Acharya Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 0, installmentPlansUsed: 0, avgDelayDays: 0, siblings: 4 }, defaulted: 0 },
  { name: "Deshmukh Family", features: { latePayments: 1, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 8500, installmentPlansUsed: 1, avgDelayDays: 5, siblings: 2 }, defaulted: 0 },
  { name: "Kulkarni Family", features: { latePayments: 2, overdueMonths: 0, hadPartialPayment: true, outstandingAmount: 9500, installmentPlansUsed: 0, avgDelayDays: 6, siblings: 1 }, defaulted: 0 },
  { name: "Naidu Family", features: { latePayments: 3, overdueMonths: 3, hadPartialPayment: true, outstandingAmount: 27000, installmentPlansUsed: 2, avgDelayDays: 19, siblings: 2 }, defaulted: 1 },
  { name: "Shetty Family", features: { latePayments: 4, overdueMonths: 2, hadPartialPayment: false, outstandingAmount: 19500, installmentPlansUsed: 3, avgDelayDays: 13, siblings: 1 }, defaulted: 1 },
  { name: "Patil Family", features: { latePayments: 5, overdueMonths: 4, hadPartialPayment: true, outstandingAmount: 34000, installmentPlansUsed: 2, avgDelayDays: 22, siblings: 3 }, defaulted: 1 },
  { name: "Gowda Family", features: { latePayments: 0, overdueMonths: 0, hadPartialPayment: false, outstandingAmount: 4000, installmentPlansUsed: 0, avgDelayDays: 0, siblings: 1 }, defaulted: 0 }
];

export interface ModelWeights {
  [key: string]: number;
  intercept: number;
  latePayments: number;
  overdueMonths: number;
  hadPartialPayment: number;
  outstandingPer10k: number;
  installmentPlansUsed: number;
  avgDelayDaysPer7: number;
  siblings: number;
}

// Convert raw TrainingInstance features into scaled input vector matching risk.ts logic
export function getFeatureVector(inst: TrainingInstance): number[] {
  const f = inst.features;
  return [
    f.latePayments,
    f.overdueMonths,
    f.hadPartialPayment ? 1 : 0,
    f.outstandingAmount / 10000,
    f.installmentPlansUsed,
    f.avgDelayDays / 7,
    Math.max(0, f.siblings - 1)
  ];
}

// Calculate Euclidean distance between two vectors
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

// Find k-nearest neighbors in a target class
function getKNearestNeighbors(index: number, classInstances: TrainingInstance[], k: number): TrainingInstance[] {
  const target = getFeatureVector(classInstances[index]);
  const distances = classInstances.map((inst, idx) => {
    if (idx === index) return { idx, dist: Infinity };
    const features = getFeatureVector(inst);
    return { idx, dist: euclideanDistance(target, features) };
  });
  
  distances.sort((a, b) => a.dist - b.dist);
  return distances.slice(0, k).map(d => classInstances[d.idx]);
}

// Draw a synthetic instance along the line connecting base and neighbor (SMOTE interpolation)
function createSyntheticInstance(
  base: TrainingInstance,
  neighbor: TrainingInstance,
  classLabel: number,
  index: number
): TrainingInstance {
  const fBase = base.features;
  const fNeighbor = neighbor.features;
  const rand = Math.random();

  return {
    name: `Synthetic_${classLabel === 1 ? 'Default' : 'OnTime'}_${index}`,
    features: {
      latePayments: Math.max(0, Math.round(fBase.latePayments + rand * (fNeighbor.latePayments - fBase.latePayments))),
      overdueMonths: Math.max(0, Math.round(fBase.overdueMonths + rand * (fNeighbor.overdueMonths - fBase.overdueMonths))),
      hadPartialPayment: Math.random() > 0.5 ? fBase.hadPartialPayment : fNeighbor.hadPartialPayment,
      outstandingAmount: Math.max(0, Math.round(fBase.outstandingAmount + rand * (fNeighbor.outstandingAmount - fBase.outstandingAmount))),
      installmentPlansUsed: Math.max(0, Math.round(fBase.installmentPlansUsed + rand * (fNeighbor.installmentPlansUsed - fBase.installmentPlansUsed))),
      avgDelayDays: Math.max(0, Number((fBase.avgDelayDays + rand * (fNeighbor.avgDelayDays - fBase.avgDelayDays)).toFixed(1))),
      siblings: Math.max(1, Math.round(fBase.siblings + rand * (fNeighbor.siblings - fBase.siblings)))
    },
    defaulted: classLabel
  };
}

// SMOTE implementation to scale minority and majority classes to targetSize (e.g. 5000)
export function runSMOTE(seedData: TrainingInstance[], targetSize: number): TrainingInstance[] {
  const minority = seedData.filter(d => d.defaulted === 1);
  const majority = seedData.filter(d => d.defaulted === 0);
  
  const targetPerClass = Math.floor(targetSize / 2);
  const syntheticMinority: TrainingInstance[] = [...minority];
  const syntheticMajority: TrainingInstance[] = [...majority];

  const k = 3;

  // 1. Oversample minority using SMOTE interpolation
  let minIndex = 0;
  while (syntheticMinority.length < targetPerClass) {
    const baseIdx = Math.floor(Math.random() * minority.length);
    const base = minority[baseIdx];
    const neighbors = getKNearestNeighbors(baseIdx, minority, k);
    if (neighbors.length > 0) {
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      syntheticMinority.push(createSyntheticInstance(base, neighbor, 1, minIndex++));
    } else {
      syntheticMinority.push({ ...base, name: `Synthetic_Default_Clone_${minIndex++}` });
    }
  }

  // 2. Oversample majority using SMOTE interpolation for balance
  let majIndex = 0;
  while (syntheticMajority.length < targetPerClass) {
    const baseIdx = Math.floor(Math.random() * majority.length);
    const base = majority[baseIdx];
    const neighbors = getKNearestNeighbors(baseIdx, majority, k);
    if (neighbors.length > 0) {
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      syntheticMajority.push(createSyntheticInstance(base, neighbor, 0, majIndex++));
    } else {
      syntheticMajority.push({ ...base, name: `Synthetic_OnTime_Clone_${majIndex++}` });
    }
  }

  // Combine and shuffle
  const dataset = [...syntheticMinority, ...syntheticMajority];
  return dataset.sort(() => Math.random() - 0.5);
}

// Generate the 5000 synthetic SMOTE training instances
export const SMOTE_TRAINING_DATA = runSMOTE(TRAINING_DATA, 5000);

// Map array representation back to ModelWeights object
export function vectorToWeights(w: number[], intercept: number): ModelWeights {
  return {
    intercept,
    latePayments: w[0],
    overdueMonths: w[1],
    hadPartialPayment: w[2],
    outstandingPer10k: w[3],
    installmentPlansUsed: w[4],
    avgDelayDaysPer7: w[5],
    siblings: w[6]
  };
}

// Calculate Regularized Binary Cross-Entropy Loss (L2 penalty) over SMOTE data
export function calculateLoss(
  weights: number[], 
  intercept: number, 
  data: TrainingInstance[], 
  lambda: number = 0.05
): number {
  let totalLoss = 0;
  const m = data.length;

  for (let i = 0; i < m; i++) {
    const x = getFeatureVector(data[i]);
    const y = data[i].defaulted;
    
    let z = intercept;
    for (let j = 0; j < x.length; j++) {
      z += weights[j] * x[j];
    }
    
    const h = sigmoid(z);
    const eps = 1e-15;
    const prediction = Math.max(eps, Math.min(1 - eps, h));
    totalLoss += -(y * Math.log(prediction) + (1 - y) * Math.log(1 - prediction));
  }

  let loss = totalLoss / m;

  // L2 Regularization penalty: lambda / (2 * m) * sum(w_j^2)
  let l2Penalty = 0;
  for (let j = 0; j < weights.length; j++) {
    l2Penalty += weights[j] * weights[j];
  }
  loss += (lambda * l2Penalty) / (2 * m);

  return Number(loss.toFixed(5));
}

// Calculate Accuracy
export function calculateAccuracy(weights: number[], intercept: number, data: TrainingInstance[]): number {
  let correct = 0;
  const m = data.length;

  for (let i = 0; i < m; i++) {
    const x = getFeatureVector(data[i]);
    const y = data[i].defaulted;
    
    let z = intercept;
    for (let j = 0; j < x.length; j++) {
      z += weights[j] * x[j];
    }
    
    const prediction = sigmoid(z) >= 0.5 ? 1 : 0;
    if (prediction === y) {
      correct++;
    }
  }

  return Number((correct / m * 100).toFixed(1));
}

// Run one epoch of regularized batch gradient descent (L2 Ridge penalty)
export function trainStep(
  weights: number[],
  intercept: number,
  data: TrainingInstance[],
  learningRate: number,
  lambda: number = 0.05
): { weights: number[]; intercept: number; loss: number; accuracy: number } {
  const m = data.length;
  const n = weights.length;
  
  const dW = new Array(n).fill(0);
  let dIntercept = 0;

  for (let i = 0; i < m; i++) {
    const x = getFeatureVector(data[i]);
    const y = data[i].defaulted;
    
    let z = intercept;
    for (let j = 0; j < n; j++) {
      z += weights[j] * x[j];
    }
    
    const diff = sigmoid(z) - y;
    
    for (let j = 0; j < n; j++) {
      dW[j] += diff * x[j];
    }
    dIntercept += diff;
  }

  // Update parameters with L2 regularization
  const nextWeights = weights.map((w, j) => w - (learningRate * (dW[j] + lambda * w)) / m);
  const nextIntercept = intercept - (learningRate * dIntercept) / m;

  const loss = calculateLoss(nextWeights, nextIntercept, data, lambda);
  const accuracy = calculateAccuracy(nextWeights, nextIntercept, data);

  return {
    weights: nextWeights,
    intercept: nextIntercept,
    loss,
    accuracy
  };
}
