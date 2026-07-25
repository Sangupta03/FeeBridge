import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Copy, Check, Info, HelpCircle } from 'lucide-react';
import { useAppStore, useForecast } from '../../store/useAppStore';
import { inr, inrShort } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isActionable?: boolean;
  type?: 'risk' | 'reminder' | 'forecast' | 'general';
  data?: any;
}

interface FeeBridgeGeniusProps {
  onClose: () => void;
  onOfferPlan?: (invoiceId: string) => void;
}

export function FeeBridgeGenius({ onClose, onOfferPlan }: FeeBridgeGeniusProps) {
  const data = useAppStore((s) => s.data)!;
  const user = useAppStore((s) => s.user)!;
  const profiles = useAppStore((s) => s.riskProfiles());
  const forecast = useForecast();

  const isParent = user.role === 'parent';
  const familyId = user.familyId || '';
  const balance = useAppStore((s) => s.familyBalance(familyId));

  const [messages, setMessages] = useState<Message[]>(() => {
    if (isParent) {
      const kids = data.students.filter((s) => s.familyId === familyId).map((s) => s.name).join(' & ');
      return [
        {
          sender: 'assistant',
          text: `Hello! I'm your **FeeBridge Family Assistant**. I'm here to help you manage your household school fees for **${kids}**.\n\nYour family's outstanding balance is **${inr(balance)}**. I can help you understand your invoices, review payment options, or explain installment options. What can I do for you today?`,
          timestamp: new Date(),
        }
      ];
    } else {
      return [
        {
          sender: 'assistant',
          text: "Hello! I'm **FeeBridge Genius**, your office AI copilot. I analyze family payment histories, risk factors, and collection forecasts to help you manage fees with empathy and clarity. \n\nWhat can I assist you with today?",
          timestamp: new Date(),
        }
      ];
    }
  });

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: queryText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate thinking delay
    setTimeout(() => {
      const normalizedQuery = queryText.toLowerCase().trim();
      let responseText = "";
      let responseType: Message['type'] = 'general';
      let responseData: any = null;

      if (isParent) {
        // Parent role chatbot logic
        if (normalizedQuery.includes('balance') || normalizedQuery.includes('invoice') || normalizedQuery.includes('bill') || normalizedQuery.includes('due')) {
          const invoices = data.invoices.filter((i) => i.familyId === familyId && outstandingOf(i) > 0);
          
          if (invoices.length === 0) {
            responseText = `You have **no outstanding fees**! Your family balance is clean. Thank you!`;
          } else {
            responseText = `Your family outstanding balance is **${inr(balance)}**:\n\n` + 
              invoices.map(i => `* **${i.title}**: ${inr(outstandingOf(i))} (Due: ${new Date(i.dueDate).toLocaleDateString()})`).join('\n') +
              `\n\nYou can pay this directly using the payment buttons or apply for an installment plan on your dashboard.`;
          }
        } else if (normalizedQuery.includes('split') || normalizedQuery.includes('installment') || normalizedQuery.includes('more time') || normalizedQuery.includes('parts') || normalizedQuery.includes('monthly')) {
          responseText = `We understand that large lump-sum payments can be challenging. \n\nYou can divide your outstanding fees into **2, 3, or 4 monthly parts** directly on your Parent Wallet using the **"Need more time?"** card. \n\n*For example, your balance of ${inr(balance)} could be split into:* \n* **2 monthly parts** of ${inr(balance / 2)} \n* **3 monthly parts** of ${inr(balance / 3)} \n* **4 monthly parts** of ${inr(balance / 4)} \n\nYou can choose your preferred day of the month for installments. Simply click "Plan details" on your dashboard to save it.`;
        } else if (normalizedQuery.includes('upi') || normalizedQuery.includes('pay') || normalizedQuery.includes('gpay') || normalizedQuery.includes('phonepe') || normalizedQuery.includes('paytm')) {
          responseText = `Paying is quick and secure:\n1. Click the **"Pay Now"** button next to your open invoice or next installment.\n2. Choose your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM).\n3. Scan the generated QR code or enter your payment PIN to complete the transaction.\n\nTransactions reconcile instantly on our records!`;
        } else {
          responseText = `I can help you review your balance, understand installment options, or guide you through payments. Try asking me:\n\n* **"What is my balance?"** to see detailed invoices.\n* **"How do I split payments?"** to see installment calculations.\n* **"How do I pay?"** to review UPI instructions.`;
        }
      } else {
        // Admin role chatbot logic
        if (normalizedQuery.includes('risk') || normalizedQuery.includes('nudge') || normalizedQuery.includes('help') || normalizedQuery.includes('worth')) {
          const atRisk = Object.values(profiles)
            .filter((p) => p.result.band !== 'healthy')
            .sort((a, b) => a.result.score - b.result.score);

          if (atRisk.length === 0) {
            responseText = "I've scanned all families, and **every household is currently on track**! There are no active payment risks flagged at this moment.";
          } else {
            responseText = `I've analyzed the payment profiles. There are **${atRisk.length} families** currently flagged for a gentle nudge or assistance:`;
            responseType = 'risk';
            responseData = atRisk.map(p => {
              const fam = data.families.find(f => f.id === p.familyId)!;
              const invoice = data.invoices
                .filter(i => i.familyId === p.familyId && outstandingOf(i) > 0)
                .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];
              return {
                familyId: p.familyId,
                familyName: fam.name,
                guardianName: fam.guardianName,
                score: p.result.score,
                band: p.result.band,
                reasons: p.result.reasons,
                outstanding: invoice ? outstandingOf(invoice) : 0,
                invoiceId: invoice?.id
              };
            });
          }
        } else if (normalizedQuery.includes('reminder') || normalizedQuery.includes('whatsapp') || normalizedQuery.includes('message') || normalizedQuery.includes('sharma') || normalizedQuery.includes('patel') || normalizedQuery.includes('rao') || normalizedQuery.includes('verma')) {
          let targetFamily = data.families.find(f => normalizedQuery.includes(f.name.toLowerCase()) || normalizedQuery.includes(f.guardianName.toLowerCase()));
          
          if (!targetFamily) {
            const outstandingFamilies = data.families.filter(f => {
              const bal = data.invoices.filter(i => i.familyId === f.id).reduce((sum, i) => sum + outstandingOf(i), 0);
              return bal > 0;
            });
            
            responseText = "Which family would you like to draft a reminder for? Here are the families with outstanding balances:";
            responseType = 'reminder';
            responseData = outstandingFamilies.map(f => {
              const bal = data.invoices.filter(i => i.familyId === f.id).reduce((sum, i) => sum + outstandingOf(i), 0);
              return {
                id: f.id,
                name: f.name,
                guardianName: f.guardianName,
                balance: bal
              };
            });
          } else {
            const bal = data.invoices.filter(i => i.familyId === targetFamily!.id).reduce((sum, i) => sum + outstandingOf(i), 0);
            const kids = data.students.filter(s => s.familyId === targetFamily!.id).map(s => s.name).join(' and ');
            
            const reminderText = `Hi ${targetFamily.guardianName},\n\nWe hope you're doing well. This is a gentle note regarding the Term 2 fees for ${kids} (${inr(bal)}). We want to make sure fee payments are stress-free for your household. If splitting this into a flexible monthly installment plan would help, we can set that up in one click.\n\nNo pressure at all — let us know how you'd like to proceed! \n- Green Valley School Office`;
            
            responseText = `Here is an empathetic draft reminder for the **${targetFamily.name}** family. It frames the conversation around support and offers a flexible payment plan rather than just demanding payment:`;
            responseData = {
              draft: reminderText,
              familyName: targetFamily.name,
              id: targetFamily.id
            };
          }
        } else if (normalizedQuery.includes('forecast') || normalizedQuery.includes('collection') || normalizedQuery.includes('expected') || normalizedQuery.includes('rupee')) {
          const totalDue = data.invoices.reduce((sum, i) => sum + i.amountDue, 0);
          const totalPaid = data.invoices.reduce((sum, i) => sum + i.amountPaid, 0);
          const rate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
          
          responseText = `### Fee Collection Analytics\n* **Total Billed:** ${inr(totalDue)}\n* **Collected to Date:** ${inr(totalPaid)} (${rate}% collection rate)\n* **Outstanding Amount:** ${inr(forecast.totalOutstanding)}\n\n### Collection Prediction (Explainable Logistic Model)\nOur model estimates we will collect **${inr(forecast.expected)}** of the outstanding amount, with an honest confidence range of **${inr(forecast.low)} to ${inr(forecast.high)}** (confidence level: ${Math.round(forecast.confidence * 100)}%). \n\n**Key Insights:**\n1. The confidence index is shaped by historical delay averages and installment behaviors.\n2. Offering installment plans to the **${Object.values(profiles).filter(p => p.result.band === 'at_risk').length} at-risk families** will likely shift the expected collection towards the high estimate of ${inrShort(forecast.high)}.`;
          responseType = 'forecast';
        } else {
          responseText = "I can help you analyze risk profiles, draft empathetic reminders, or interpret collections forecast. Here are some things you can ask me:\n\n* **\"Show risk profiles\"** to find families who might need assistance.\n* **\"Draft WhatsApp reminder\"** to create a kind reminder message.\n* **\"Explain collection forecast\"** to see predictive trends.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: responseText,
          timestamp: new Date(),
          type: responseType,
          data: responseData
        }
      ]);
    }, 800);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[460px] max-w-full bg-paper border-l border-line shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-brand p-4 text-cream">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cream text-brand">
              <Sparkles size={16} fill="currentColor" className="animate-pulse" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-cream">
                {isParent ? 'Family Assistant' : 'FeeBridge Genius'}
              </h2>
              <p className="text-[10px] text-cream/70 tracking-wide uppercase font-bold font-sans">
                {isParent ? 'Parent Portal Copilot' : 'Office AI Copilot'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-brand-mid transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isAss = msg.sender === 'assistant';
            return (
              <div 
                key={index} 
                className={`flex gap-3 ${isAss ? 'justify-start' : 'justify-end'}`}
              >
                {isAss && (
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-mint text-brand-dark mt-1">
                    <Sparkles size={14} />
                  </span>
                )}
                
                <div className="space-y-3 max-w-[85%]">
                  <div 
                    className={`rounded-lg p-3.5 text-sm leading-relaxed shadow-sm ${
                      isAss 
                        ? 'bg-white border border-line text-ink dark:bg-[#1a201d]' 
                        : 'bg-brand text-cream'
                    }`}
                  >
                    <p className="whitespace-pre-line text-ink">
                      {msg.text}
                    </p>
                    
                    {/* Render helpers for admin */}
                    {msg.type === 'risk' && msg.data && (
                      <div className="mt-3 space-y-2 border-t border-line pt-3">
                        {msg.data.map((f: any) => (
                          <div key={f.familyId} className="rounded border border-line bg-paper dark:bg-[#151a17] p-2.5 text-xs text-ink">
                            <div className="flex justify-between font-semibold">
                              <span>{f.familyName} ({f.guardianName})</span>
                              <span className={f.band === 'at_risk' ? 'text-terra-dark font-bold' : 'text-amber font-bold'}>
                                {f.score} · {f.band === 'at_risk' ? 'At Risk' : 'Watch'}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-muted">
                              Outstanding: {inr(f.outstanding)}
                            </div>
                            <ul className="mt-1.5 list-disc list-inside text-[11px] text-body">
                              {f.reasons.map((r: any, i: number) => (
                                <li key={i}>{r.label}</li>
                              ))}
                            </ul>
                            <div className="mt-2.5 flex gap-2">
                              {f.invoiceId && onOfferPlan && (
                                <button 
                                  className="btn-primary py-1 px-2.5 text-[10px]"
                                  onClick={() => {
                                    onOfferPlan(f.invoiceId);
                                    onClose();
                                  }}
                                >
                                  Offer Plan
                                </button>
                              )}
                              <button 
                                className="btn-ghost py-1 px-2.5 text-[10px]"
                                onClick={() => handleQuery(`Draft WhatsApp reminder for ${f.familyName}`)}
                              >
                                Draft Reminder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.type === 'reminder' && msg.data && (
                      <div className="mt-3 space-y-2 border-t border-line pt-3">
                        {msg.data.map((f: any) => (
                          <button
                            key={f.id}
                            className="w-full text-left rounded border border-line bg-paper hover:bg-white hover:border-brand/40 p-2 text-xs flex justify-between items-center cursor-pointer text-ink dark:bg-[#151a17]"
                            onClick={() => handleQuery(`Draft WhatsApp reminder for ${f.name}`)}
                          >
                            <span>{f.name} ({f.guardianName})</span>
                            <span className="font-semibold text-brand">{inr(f.balance)}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Copy button for reminder drafts */}
                    {msg.sender === 'assistant' && msg.data && msg.data.draft && (
                      <div className="mt-3 border-t border-line pt-3 space-y-2">
                        <div className="rounded bg-paper dark:bg-[#151a17] border border-line p-2 text-xs font-mono select-all whitespace-pre-wrap text-ink">
                          {msg.data.draft}
                        </div>
                        <button
                          onClick={() => copyToClipboard(msg.data.draft, msg.timestamp.toISOString())}
                          className="btn-ghost py-1 px-2.5 text-[10px] flex items-center gap-1.5"
                        >
                          {copiedId === msg.timestamp.toISOString() ? (
                            <>
                              <Check size={11} className="text-brand" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              Copy Draft text
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={`text-[9px] text-muted ${!isAss ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="border-t border-line p-3 bg-white dark:bg-[#121614] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery(input)}
            placeholder={isParent ? 'Ask about your balance or split options...' : 'Ask about risk profiles or drafts...'}
            className="flex-1 rounded-lg border border-line px-3 py-1.5 text-xs focus:outline-none focus:border-brand"
          />
          <button
            onClick={() => handleQuery(input)}
            className="btn-primary p-2 text-cream flex items-center justify-center rounded-lg"
          >
            <Send size={14} />
          </button>
        </div>

      </div>
    </>
  );
}
