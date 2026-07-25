import { useState, useEffect } from 'react';
import { Cpu, Play, RotateCcw, Sliders, Database, LineChart, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { WEIGHTS } from '../../domain/risk';
import { TRAINING_DATA, trainStep, calculateLoss, calculateAccuracy, vectorToWeights } from '../../domain/ml';
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

  // Local state for sliders/tuning
  const [localWeights, setLocalWeights] = useState({ ...currentWeights });

  // Training parameters
  const [learningRate, setLearningRate] = useState(0.1);
  const [maxEpochs, setMaxEpochs] = useState(300);
  
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
    setCost(calculateLoss(wVec, currentWeights.intercept, TRAINING_DATA));
    setAccuracy(calculateAccuracy(wVec, currentWeights.intercept, TRAINING_DATA));
  }, [currentWeights]);

  // Sync sliders to store
  const handleSliderChange = (key: keyof typeof WEIGHTS, val: number) => {
    const nextWeights = { ...localWeights, [key]: Number(val.toFixed(2)) };
    setLocalWeights(nextWeights);
    saveWeights(nextWeights);
  };

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
        const step = trainStep(wVec, intercept, TRAINING_DATA, learningRate);
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
      setCost(calculateLoss(wVec, intercept, TRAINING_DATA));
      setAccuracy(calculateAccuracy(wVec, intercept, TRAINING_DATA));
      setHistory([...epochHistory]);

      if (currentEpoch >= maxEpochs) {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 30);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="card p-5 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu size={20} className="text-brand" />
            Machine Learning Risk Calibration
          </h2>
          <p className="text-sm text-body">
            Train a logistic regression model on historical payment databases, or manually tune coefficients.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer">
            <RotateCcw size={13} />
            Reset Heuristics
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        
        {/* Left Column: Trainer & Visualization */}
        <div className="space-y-6">
          {/* Training Control */}
          <div className="card p-5 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <Cpu size={16} />
              Model Optimizer
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1">
                  Learning Rate (Alpha)
                </label>
                <select
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  disabled={isTraining}
                  className="w-full text-xs font-semibold rounded-lg border border-line p-2 bg-white dark:bg-[#1a201d]"
                >
                  <option value={0.01}>0.01 (Slow / Convergent)</option>
                  <option value={0.05}>0.05 (Cautious)</option>
                  <option value={0.1}>0.10 (Standard)</option>
                  <option value={0.2}>0.20 (Aggressive)</option>
                </select>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1">
                  Epochs (Iterations)
                </label>
                <select
                  value={maxEpochs}
                  onChange={(e) => setMaxEpochs(Number(e.target.value))}
                  disabled={isTraining}
                  className="w-full text-xs font-semibold rounded-lg border border-line p-2 bg-white dark:bg-[#1a201d]"
                >
                  <option value={100}>100 Epochs</option>
                  <option value={300}>300 Epochs</option>
                  <option value={500}>500 Epochs</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Play size={13} fill="currentColor" />
              {isTraining ? `Training Model (Epoch ${epoch}/${maxEpochs})...` : 'Train Risk Model'}
            </button>

            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-2 text-center bg-paper dark:bg-[#1a201d]/30 border border-line/45 rounded-lg p-3">
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">BCE Loss</div>
                <div className="font-serif text-lg font-bold text-ink mt-0.5">{cost}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Accuracy</div>
                <div className="font-serif text-lg font-bold text-brand mt-0.5">{accuracy}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Status</div>
                <div className="font-serif text-lg font-bold text-ink mt-0.5">
                  {isTraining ? 'Training' : storeWeights ? 'Optimized' : 'Heuristic'}
                </div>
              </div>
            </div>
          </div>

          {/* Loss Curve Plot */}
          {history.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <LineChart size={16} />
                Convergence Gradient Plot
              </h3>
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={history} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#2a332d" strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="epoch" tick={{ fill: '#7A7E74', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#7A7E74', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-paper)', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: 'var(--color-ink)', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="loss" stroke="var(--color-terra)" strokeWidth={2} name="Loss" dot={false} />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-brand)" strokeWidth={2} name="Accuracy %" dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Historical Data View */}
          <div className="card p-5 space-y-3">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <Database size={16} />
              Historical Training Set ({TRAINING_DATA.length} families)
            </h3>
            <div className="overflow-x-auto max-h-64 border border-line/45 rounded-lg">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="bg-paper dark:bg-[#1a201d]/60 text-muted uppercase font-bold tracking-wider border-b border-line">
                    <th className="p-2 border-r border-line">Name</th>
                    <th className="p-2 border-r border-line text-center">Late</th>
                    <th className="p-2 border-r border-line text-center">Overdue</th>
                    <th className="p-2 border-r border-line text-center">Partial</th>
                    <th className="p-2 border-r border-line text-center">Amt (10k)</th>
                    <th className="p-2 border-r border-line text-center">Plans</th>
                    <th className="p-2 border-r border-line text-center">Delay</th>
                    <th className="p-2 border-r border-line text-center">Siblings</th>
                    <th className="p-2 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {TRAINING_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-paper/40">
                      <td className="p-2 border-r border-line font-semibold text-ink">{row.name}</td>
                      <td className="p-2 border-r border-line text-center text-body">{row.features.latePayments}</td>
                      <td className="p-2 border-r border-line text-center text-body">{row.features.overdueMonths}</td>
                      <td className="p-2 border-r border-line text-center text-body">{row.features.hadPartialPayment ? 'Y' : 'N'}</td>
                      <td className="p-2 border-r border-line text-center text-body">{(row.features.outstandingAmount/10000).toFixed(1)}</td>
                      <td className="p-2 border-r border-line text-center text-body">{row.features.installmentPlansUsed}</td>
                      <td className="p-2 border-r border-line text-center text-body">{Math.round(row.features.avgDelayDays)}d</td>
                      <td className="p-2 border-r border-line text-center text-body">{row.features.siblings}</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.defaulted === 1 ? 'bg-peach text-terra-dark' : 'bg-mint text-brand-dark'
                        }`}>
                          {row.defaulted === 1 ? 'Late' : 'On-Time'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Weight Sliders / Manual Tuning */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <Sliders size={16} />
              Coefficient Tuning Dashboard
            </h3>
            
            <div className="rounded-lg bg-mint/30 dark:bg-mint/5 border border-line p-3 flex gap-2 items-start text-xs text-body leading-relaxed">
              <Info size={14} className="text-brand flex-none mt-0.5" />
              <span>
                These weights feed directly into the squashing logistic function. Positive weights increase default probability (lowering health scores).
              </span>
            </div>

            <div className="space-y-4 pt-2">
              <SliderRow
                label="Late payments weight"
                value={localWeights.latePayments}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => handleSliderChange('latePayments', v)}
              />
              <SliderRow
                label="Overdue months weight"
                value={localWeights.overdueMonths}
                min={0}
                max={2.5}
                step={0.05}
                onChange={(v) => handleSliderChange('overdueMonths', v)}
              />
              <SliderRow
                label="Partial payment weight"
                value={localWeights.hadPartialPayment}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => handleSliderChange('hadPartialPayment', v)}
              />
              <SliderRow
                label="Outstanding per 10k weight"
                value={localWeights.outstandingPer10k}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => handleSliderChange('outstandingPer10k', v)}
              />
              <SliderRow
                label="Installment plans used weight"
                value={localWeights.installmentPlansUsed}
                min={0}
                max={1.5}
                step={0.05}
                onChange={(v) => handleSliderChange('installmentPlansUsed', v)}
              />
              <SliderRow
                label="Avg delay days weight"
                value={localWeights.avgDelayDaysPer7}
                min={0}
                max={1.5}
                step={0.05}
                onChange={(v) => handleSliderChange('avgDelayDaysPer7', v)}
              />
              <SliderRow
                label="Siblings coefficient"
                value={localWeights.siblings}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => handleSliderChange('siblings', v)}
              />
              <SliderRow
                label="Model Intercept (Bias)"
                value={localWeights.intercept}
                min={-5}
                max={0}
                step={0.1}
                onChange={(v) => handleSliderChange('intercept', v)}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold text-ink">
        <span>{label}</span>
        <span className="font-mono bg-paper px-1.5 py-0.5 rounded border border-line/45">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-line rounded-lg appearance-none cursor-pointer accent-brand dark:bg-line/40"
      />
    </div>
  );
}
