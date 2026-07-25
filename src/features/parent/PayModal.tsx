import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../../components/ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { buildUpiLink } from '../../domain/forecast';
import { inr } from '../../lib/format';
import { QrCode, Smartphone, ArrowLeft, CheckCircle2, Lock, Delete } from 'lucide-react';

interface PayModalProps {
  amount: number;
  label: string;
  studentId?: string;
  onClose: () => void;
}

const SCHOOL_VPA = import.meta.env.VITE_SCHOOL_UPI_VPA || 'school@upi';
const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Green Valley School';

type PaymentTab = 'qr' | 'simulate';
type SimulationStep = 'app-select' | 'payment-intent' | 'pin-entry' | 'processing' | 'success';

interface UpiApp {
  id: string;
  name: string;
  color: string;
  logoBg: string;
  logoText: string;
}

const UPI_APPS: UpiApp[] = [
  { id: 'gpay', name: 'Google Pay', color: 'bg-[#1a73e8]', logoBg: 'bg-white', logoText: 'text-[#1a73e8] font-bold' },
  { id: 'phonepe', name: 'PhonePe', color: 'bg-[#5f259f]', logoBg: 'bg-white', logoText: 'text-[#5f259f] font-bold' },
  { id: 'paytm', name: 'Paytm', color: 'bg-[#00baf2]', logoBg: 'bg-white', logoText: 'text-[#00baf2] font-bold' },
  { id: 'bhim', name: 'BHIM UPI', color: 'bg-[#e85c2b]', logoBg: 'bg-white', logoText: 'text-brand font-bold' },
];

export function PayModal({ amount, label, studentId, onClose }: PayModalProps) {
  const recordPayment = useAppStore((s) => s.recordPayment);
  const user = useAppStore((s) => s.user)!;
  
  const [activeTab, setActiveTab] = useState<PaymentTab>('simulate');
  const [simStep, setSimStep] = useState<SimulationStep>('app-select');
  const [selectedApp, setSelectedApp] = useState<UpiApp | null>(null);
  const [pin, setPin] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ status: string } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const upiLink = buildUpiLink({
    vpa: SCHOOL_VPA,
    payeeName: SCHOOL_NAME,
    amount,
    note: label,
  });

  // Confetti effect on success
  useEffect(() => {
    if (simStep === 'success' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || 360;
      canvas.height = 360;

      const colors = ['#1B6B54', '#C56A45', '#B98328', '#2e86c1', '#a569bd', '#1abc9c'];
      const particles = Array.from({ length: 80 }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
      }));

      let animationId: number;
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, idx) => {
          p.tiltAngle += p.tiltAngleIncremental;
          p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
          p.x += Math.sin(p.tiltAngle);
          p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx.stroke();
        });

        // Loop particles back to top
        particles.forEach((p) => {
          if (p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
          }
        });

        animationId = requestAnimationFrame(draw);
      };

      draw();
      return () => cancelAnimationFrame(animationId);
    }
  }, [simStep]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const submitPin = async () => {
    if (pin.length < 4) return;
    setSimStep('processing');
    setSaving(true);
    
    // Simulate network delay
    setTimeout(async () => {
      try {
        const outcome = await recordPayment({
          familyId: user.familyId!,
          studentId,
          amount,
          method: 'upi',
          reference: `UPI-${Date.now()}`,
          note: label,
        });
        setResult(outcome);
        setSimStep('success');
      } catch (err) {
        console.error('[pay] recordPayment failed:', err);
        setResult({ status: 'error' });
        setSimStep('app-select');
        setPin('');
      } finally {
        setSaving(false);
      }
    }, 1800);
  };

  async function markPaidLegacy() {
    setSaving(true);
    try {
      const outcome = await recordPayment({
        familyId: user.familyId!,
        studentId,
        amount,
        method: 'upi',
        reference: `UPI-${Date.now()}`,
        note: label,
      });
      setResult(outcome);
    } catch (err) {
      console.error('[pay] recordPayment failed:', err);
      setResult({ status: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function resultMessage(status: string): string {
    if (status === 'matched') return "Payment received and matched. Thank you!";
    if (status === 'review') return 'Payment received — the office will confirm it shortly.';
    if (status === 'error') return "Couldn't save that — check your connection and try again.";
    return 'This looks like a payment already recorded today.';
  }

  return (
    <Modal title="Pay with UPI" onClose={onClose}>
      
      {/* Tab select - only if not success or processing */}
      {simStep !== 'success' && simStep !== 'processing' && (
        <div className="flex border-b border-line mb-4">
          <button
            onClick={() => setActiveTab('simulate')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'simulate' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Smartphone size={13} />
            Simulate App
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'qr' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <QrCode size={13} />
            Scan QR Code
          </button>
        </div>
      )}

      {/* Legacy QR view */}
      {activeTab === 'qr' && (
        <div className="space-y-4">
          <p className="text-sm text-muted text-center">{label}</p>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-white p-5">
            <QRCodeSVG value={upiLink} size={180} />
            <div className="font-serif text-3xl font-bold text-ink">{inr(amount)}</div>
            <p className="text-xs text-muted">Scan with any UPI app</p>
          </div>

          {result ? (
            <div className="rounded-lg bg-paper2 p-4 text-sm text-body">
              <p>{resultMessage(result.status)}</p>
              <div className="mt-3 flex gap-2">
                {result.status === 'error' && (
                  <button className="btn-primary" onClick={() => { setResult(null); void markPaidLegacy(); }}>
                    Try again
                  </button>
                )}
                <button className="btn-ghost" onClick={onClose}>Close</button>
              </div>
            </div>
          ) : (
            <button className="btn-primary w-full" disabled={saving} onClick={() => { void markPaidLegacy(); }}>
              {saving ? 'Saving…' : "I've paid"}
            </button>
          )}
        </div>
      )}

      {/* Simulator view */}
      {activeTab === 'simulate' && (
        <div className="flex flex-col items-center">
          
          {/* Main Simulated Phone Screen */}
          <div className="w-[320px] h-[400px] border border-line rounded-3xl bg-[#f8f9fa] shadow-inner overflow-hidden flex flex-col relative font-sans text-ink">
            
            {/* Phone Top Notch Bar */}
            <div className="bg-ink text-white/90 text-[10px] px-4 py-1 flex justify-between items-center flex-none">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>5G</span>
                <span className="w-4 h-2 border border-white/75 rounded-sm relative inline-block"><span className="absolute top-0.5 right-0.5 bottom-0.5 left-0.5 bg-white rounded-2xs"></span></span>
              </div>
            </div>

            {/* Step 1: App Selection */}
            {simStep === 'app-select' && (
              <div className="p-4 flex-1 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-center mb-1 text-ink">Select UPI Application</h3>
                <p className="text-[11px] text-muted text-center mb-4">Choose a payment app to simulate checkout</p>
                <div className="grid grid-cols-2 gap-3">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        setSimStep('payment-intent');
                      }}
                      className="p-3.5 border border-line rounded-xl bg-white hover:border-brand shadow-sm flex flex-col items-center text-center transition-all hover:scale-105"
                    >
                      <span className={`w-8 h-8 rounded-lg ${app.logoBg} ${app.logoText} flex items-center justify-center border border-line shadow-sm text-xs`}>
                        {app.name[0]}
                      </span>
                      <span className="mt-2 text-xs font-semibold text-ink">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Payment Intent (Proceed to pay) */}
            {simStep === 'payment-intent' && selectedApp && (
              <div className="flex-1 flex flex-col">
                {/* App Brand Header */}
                <div className={`p-4 ${selectedApp.color} text-white flex items-center gap-2 flex-none`}>
                  <button onClick={() => setSimStep('app-select')} className="text-white hover:opacity-85">
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-xs font-bold">{selectedApp.name}</span>
                </div>
                
                {/* Intent Details */}
                <div className="p-4 flex-1 flex flex-col justify-between items-center">
                  <div className="text-center w-full mt-4">
                    <div className="text-[11px] text-muted uppercase tracking-wider font-bold">Paying Merchant</div>
                    <div className="text-sm font-bold text-ink mt-0.5">{SCHOOL_NAME}</div>
                    <div className="text-xs text-muted">{SCHOOL_VPA}</div>
                    
                    <div className="font-serif text-3.5xl font-bold text-ink mt-6">{inr(amount)}</div>
                    <div className="text-xs rounded-full bg-paper2 text-body inline-block px-3 py-1 mt-2 border border-line">
                      Reason: {label}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSimStep('pin-entry')}
                    className="w-full bg-[#1b6b54] text-cream hover:bg-brand-dark py-2.5 rounded-lg text-xs font-bold tracking-wide shadow-md transition-colors"
                  >
                    PROCEED TO PAY
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: UPI PIN Entry */}
            {simStep === 'pin-entry' && selectedApp && (
              <div className="flex-1 flex flex-col bg-[#f0f3f4]">
                {/* Header */}
                <div className="bg-brand text-cream p-3 flex items-center justify-between flex-none">
                  <div className="flex items-center gap-1.5">
                    <Lock size={12} />
                    <span className="text-[11px] font-bold">Secure UPI Payment</span>
                  </div>
                  <span className="text-[10px] opacity-80">{selectedApp.name}</span>
                </div>

                {/* PIN Display */}
                <div className="p-3 text-center flex-none">
                  <div className="text-xs font-semibold text-ink">Enter 4-Digit UPI PIN</div>
                  <div className="text-[10px] text-muted mt-0.5">Paying {SCHOOL_NAME}</div>
                  
                  {/* Dots */}
                  <div className="flex justify-center gap-3 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded-full border-2 border-brand-mid transition-all duration-100 ${
                          pin.length > i ? 'bg-brand' : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Keypad */}
                <div className="flex-1 grid grid-cols-3 gap-0.5 bg-line p-0.5 text-ink text-sm font-semibold select-none">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeyPress(num)}
                      className="bg-white active:bg-paper2 flex items-center justify-center transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    onClick={handleBackspace}
                    className="bg-[#e5dec5]/30 active:bg-paper2 flex items-center justify-center text-terra-dark"
                  >
                    <Delete size={16} />
                  </button>
                  <button 
                    onClick={() => handleKeyPress('0')}
                    className="bg-white active:bg-paper2 flex items-center justify-center"
                  >
                    0
                  </button>
                  <button 
                    onClick={submitPin}
                    disabled={pin.length < 4}
                    className="bg-brand text-cream active:bg-brand-dark flex items-center justify-center disabled:opacity-50 transition-colors"
                  >
                    Pay
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Loading / Processing */}
            {simStep === 'processing' && (
              <div className="flex-1 flex flex-col justify-center items-center bg-white p-4">
                <div className="relative w-12 h-12">
                  <span className="absolute inset-0 border-4 border-mint border-t-brand rounded-full animate-spin"></span>
                </div>
                <div className="mt-4 text-xs font-semibold text-ink">Contacting bank...</div>
                <div className="text-[10px] text-muted mt-1">Securing connection to server</div>
              </div>
            )}

            {/* Step 5: Success animation */}
            {simStep === 'success' && result && (
              <div className="flex-1 flex flex-col justify-between items-center bg-white p-4 text-center">
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
                
                <div className="mt-8 flex flex-col items-center z-20">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink mt-4">Transaction Successful</h3>
                  <div className="font-serif text-2xl font-bold text-[#1b6b54] mt-1">{inr(amount)}</div>
                </div>

                <div className="w-full text-xs text-body bg-paper p-3 rounded-lg border border-line z-20 mb-4">
                  <p className="font-semibold text-emerald-800">{resultMessage(result.status)}</p>
                  <p className="text-[10px] text-muted mt-1 font-mono">Ref: UPI-{Date.now().toString().slice(-8)}</p>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full btn-primary py-2 text-xs font-bold z-20 shadow-md"
                >
                  Return to Wallet
                </button>
              </div>
            )}

          </div>

          {/* Device border bottom accent line */}
          <div className="text-[10px] text-muted mt-2 text-center flex items-center gap-1.5">
            <Lock size={10} /> Fully offline-supported mock environment
          </div>

        </div>
      )}

    </Modal>
  );
}

