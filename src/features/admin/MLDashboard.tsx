import { useState, useEffect } from 'react';
import { Cpu, Play, RotateCcw, Database, LineChart, Info, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { WEIGHTS } from '../../domain/risk';
import { TRAINING_DATA, SMOTE_TRAINING_DATA, trainStep, calculateLoss, calculateAccuracy, vectorToWeights } from '../../domain/ml';
import { ResponsiveContainer, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';

interface HistoryPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

export function MLDashboard() {
  const storeWeights = useAppStore((s) => s.weights);
  const saveWeights = useAppStore((s) => s.saveWeights);
  const resetWeights = useAppStore((s) => s.resetWeights);

  // Dynamic weights being configured (object representation)
  const currentWeights = storeWeights || WEIGHTS;

  // Local state for calibrated weights
  const [localWeights, setLocalWeights] = useState({ ...currentWeights });

  // Optimal fixed hyperparameters for enterprise auto-calibration
  const learningRate = 0.08;
  const maxEpochs = 250;
  
  // Training execution state
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [cost, setCost] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  
  // Plotting history
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Update local weights when store weights change
  useEffect(() => {
    setLocalWeights({ ...currentWeights });
  }, [storeWeights]);

  // Initial calculation
  useEffect(() => {
    const wVec = [
      currentWeights.latePayments,
      currentWeights.overdueMonths,
      currentWeights.hadPartialPayment,
      currentWeights.outstandingPer10k,
      currentWeights.installmentPlansUsed,
      currentWeights.avgDelayDaysPer7,
      currentWeights.siblings
    ];
    setCost(calculateLoss(wVec, currentWeights.intercept, SMOTE_TRAINING_DATA));
    setAccuracy(calculateAccuracy(wVec, currentWeights.intercept, SMOTE_TRAINING_DATA));
  }, [currentWeights]);

  const handleReset = () => {
    resetWeights();
    setHistory([]);
    setEpoch(0);
  };

  // Run training loop
  const handleTrain = () => {
    setIsTraining(true);
    setEpoch(0);
    setHistory([]);
    
    // Initial weights vector
    let wVec = [
      currentWeights.latePayments,
      currentWeights.overdueMonths,
      currentWeights.hadPartialPayment,
      currentWeights.outstandingPer10k,
      currentWeights.installmentPlansUsed,
      currentWeights.avgDelayDaysPer7,
      currentWeights.siblings
    ];
    let intercept = currentWeights.intercept;
    
    const epochHistory: HistoryPoint[] = [];
    const stepSize = 5; // run 5 epochs per animation frame for smooth visualization
    let currentEpoch = 0;

    const interval = setInterval(() => {
      for (let i = 0; i < stepSize; i++) {
        currentEpoch++;
        const step = trainStep(wVec, intercept, SMOTE_TRAINING_DATA, learningRate);
        wVec = step.weights;
        intercept = step.intercept;
        
        if (currentEpoch % 10 === 0 || currentEpoch === maxEpochs) {
          epochHistory.push({
            epoch: currentEpoch,
            loss: step.loss,
            accuracy: step.accuracy
          });
        }

        if (currentEpoch >= maxEpochs) break;
      }

      // Update UI state
      setEpoch(currentEpoch);
      const finalWeights = vectorToWeights(wVec, intercept);
      setLocalWeights(finalWeights);
      saveWeights(finalWeights);
      setCost(calculateLoss(wVec, intercept, SMOTE_TRAINING_DATA));
      setAccuracy(calculateAccuracy(wVec, intercept, SMOTE_TRAINING_DATA));
      setHistory([...epochHistory]);

      if (currentEpoch >= maxEpochs) {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 30);
  };

  // Maps coefficients to human-readable labels, impact badges, and progress bar percentages
  const getFactorReport = () => {
    const maxWeight = Math.max(
      ...Object.keys(localWeights)
        .filter(k => k !== 'intercept')
        .map(k => Math.abs(localWeights[k as keyof typeof WEIGHTS]))
    ) || 1;

    const items = [
      { key: 'overdueMonths', name: 'Consecutive Overdue Months', desc: 'Number of months in a row fees remain unpaid' },
      { key: 'latePayments', name: 'Past Late Payments', desc: 'Total times the family paid past the deadline in the past' },
      { key: 'outstandingPer10k', name: 'Outstanding Fee Balance', desc: 'Total current unpaid balance' },
      { key: 'avgDelayDaysPer7', name: 'Average Delay in Days', desc: 'Average number of days payments are delayed' },
      { key: 'hadPartialPayment', name: 'History of Partial Payments', desc: 'Whether they have paid fees in small fractions before' },
      { key: 'installmentPlansUsed', name: 'Previous Installment Plans', desc: 'Total custom payment plans offered before' },
      { key: 'siblings', name: 'Number of Children Enrolled', desc: 'Sibling load from the same household' },
    ];

    return items.map(item => {
      const val = localWeights[item.key as keyof typeof WEIGHTS] || 0;
      const ratio = Math.min(100, Math.round((Math.abs(val) / maxWeight) * 100));
      
      let badgeColor = "bg-line text-muted";
      let impactText = "Low Influence";
      if (val >= 1.5) {
        badgeColor = "bg-peach text-terra-dark";
        impactText = "Critical Influence";
      } else if (val >= 0.8) {
        badgeColor = "bg-amber/15 text-amber";
        impactText = "High Influence";
      } else if (val >= 0.3) {
        badgeColor = "bg-mint text-brand-dark";
        impactText = "Moderate Influence";
      }

      return {
        ...item,
        value: val.toFixed(2),
        ratio,
        badgeColor,
        impactText
      };
    });
  };

  const factors = getFactorReport();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu size={20} className="text-brand" />
            Automatic Risk Predictor Calibration
          </h2>
          <p className="text-sm text-body">
            Calibrate the payment risk calculator using school records to ensure family risk ratings remain accurate.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleReset} 
            className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer hover:bg-paper2 dark:hover:bg-[#1c221f]"
            disabled={isTraining}
          >
            <RotateCcw size={13} />
            Reset to Standard Settings
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        
        {/* Left Column: Auto-calibration hub & Graph */}
        <div className="space-y-6">
          
          {/* Engine Calibration Hub */}
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-ink">Risk Calibration Dashboard</h3>
                <p className="text-xs text-body mt-0.5">Statistical optimization of risk parameters</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isTraining 
                  ? 'bg-amber/15 border-amber/25 text-amber animate-pulse' 
                  : storeWeights 
                  ? 'bg-mint/40 border-brand/20 text-brand-dark' 
                  : 'bg-line/40 border-line text-muted'
              }`}>
                {isTraining ? (
                  <>
                    <TrendingUp size={11} className="animate-bounce" />
                    Optimizing Model ({epoch}/{maxEpochs})
                  </>
                ) : storeWeights ? (
                  <>
                    <CheckCircle2 size={11} className="text-brand" />
                    System Calibrated
                  </>
                ) : (
                  <>
                    <ShieldAlert size={11} />
                    Standard Settings
                  </>
                )}
              </span>
            </div>

            <div className="rounded-lg bg-mint/30 dark:bg-mint/5 border border-line p-3 text-xs text-body leading-relaxed flex gap-2">
              <Info size={14} className="text-brand flex-none mt-0.5" />
              <p>
                The system analyzes historical payment trends across 5,000 generated records to learn which factors are the strongest indicators of families needing flexible payment plans.
              </p>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-2 text-center bg-paper dark:bg-[#1a201d]/30 border border-line/45 rounded-lg p-3">
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Prediction Error</div>
                <div className="font-serif text-lg font-bold text-ink mt-0.5">{cost}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Calculator Accuracy</div>
                <div className="font-serif text-lg font-bold text-brand mt-0.5">{accuracy}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Analyzed Records</div>
                <div className="font-serif text-lg font-bold text-ink mt-0.5">5,000 files</div>
              </div>
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <Play size={13} fill="currentColor" />
              {isTraining ? `Running Calibrations...` : 'Auto-Calibrate Risk System'}
            </button>
          </div>

          {/* Loss Curve Plot */}
          {history.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="text-base font-bold flex items-center gap-1.5 text-ink">
                <LineChart size={16} />
                Calibration Progress
              </h3>
              <p className="text-xs text-body">Visual graph showing the reduction in errors and increase in accuracy as the model optimizes.</p>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={history} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="epoch" tick={{ fill: '#7A7E74', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#7A7E74', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="loss" stroke="var(--color-terra)" strokeWidth={2} name="Error Rate" dot={false} />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-brand)" strokeWidth={2} name="Accuracy %" dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Factor Influence Report (Calibrated Weights) */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-ink">Important Risk Factors</h3>
              <p className="text-xs text-body mt-0.5">Learned importance weights for individual payment history metrics</p>
            </div>

            <div className="space-y-4 pt-1">
              {factors.map(f => (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-semibold text-ink">{f.name}</span>
                      <span className="block text-[10px] text-muted">{f.desc}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-mono bg-paper dark:bg-[#1a201d] px-1.5 py-0.5 rounded border border-line/45 text-[11px] font-bold text-ink">
                        +{f.value}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded-[4px] text-[8px] font-bold tracking-wide uppercase ${f.badgeColor}`}>
                        {f.impactText}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-line/35 dark:bg-line/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand rounded-full transition-all duration-500" 
                      style={{ width: `${f.ratio}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="border-t border-line/40 pt-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-ink">Base Risk Level</span>
                  <span className="block text-[10px] text-muted">Initial risk level before considering family details</span>
                </div>
                <span className="font-mono bg-paper dark:bg-[#1a201d] px-1.5 py-0.5 rounded border border-line/45 text-[11px] font-bold text-ink">
                  {localWeights.intercept?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Historical Data View */}
      <div className="card p-5 space-y-3">
        <h3 className="text-base font-bold flex items-center gap-1.5 text-ink">
          <Database size={16} />
          Historical Base Records (30 Families)
        </h3>
        <p className="text-xs text-body">
          Sample database of actual family records used as baseline seeds to calibrate the prediction model.
        </p>
        <div className="overflow-x-auto max-h-60 border border-line/45 rounded-lg">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-paper dark:bg-[#1a201d]/60 text-muted uppercase font-bold tracking-wider border-b border-line">
                <th className="p-2 border-r border-line">Family Name</th>
                <th className="p-2 border-r border-line text-center">Late Pmts</th>
                <th className="p-2 border-r border-line text-center">Overdue Months</th>
                <th className="p-2 border-r border-line text-center">Partial Paid</th>
                <th className="p-2 border-r border-line text-center">Fee Owed</th>
                <th className="p-2 border-r border-line text-center">Prev Plans</th>
                <th className="p-2 border-r border-line text-center">Delay Days</th>
                <th className="p-2 border-r border-line text-center">Children</th>
                <th className="p-2 text-center">Historical Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {TRAINING_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-paper/40">
                  <td className="p-2 border-r border-line font-semibold text-ink">{row.name}</td>
                  <td className="p-2 border-r border-line text-center text-body">{row.features.latePayments}</td>
                  <td className="p-2 border-r border-line text-center text-body">{row.features.overdueMonths}</td>
                  <td className="p-2 border-r border-line text-center text-body">{row.features.hadPartialPayment ? 'Y' : 'N'}</td>
                  <td className="p-2 border-r border-line text-center text-body">₹{(row.features.outstandingAmount).toLocaleString()}</td>
                  <td className="p-2 border-r border-line text-center text-body">{row.features.installmentPlansUsed}</td>
                  <td className="p-2 border-r border-line text-center text-body">{Math.round(row.features.avgDelayDays)}d</td>
                  <td className="p-2 border-r border-line text-center text-body">{row.features.siblings}</td>
                  <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      row.defaulted === 1 ? 'bg-peach text-terra-dark' : 'bg-mint text-brand-dark'
                    }`}>
                      {row.defaulted === 1 ? 'Overdue' : 'On-Time'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
