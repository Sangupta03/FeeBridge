import { useState } from 'react';
import { Send, Bell, Settings, Eye, CheckCircle2, MessageSquareText, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';

export function NotificationCenter() {
  const data = useAppStore((s) => s.data)!;
  const notifications = useAppStore((s) => s.notifications);
  const sendNotification = useAppStore((s) => s.sendNotification);

  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [template, setTemplate] = useState('reminder');
  const [customText, setCustomText] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Automation rule toggles
  const [autoRisk, setAutoRisk] = useState(true);
  const [autoDue, setAutoDue] = useState(false);

  // Generate template message text based on selected family
  const getTemplateText = (famId: string, type: string) => {
    if (!famId) return '';
    const fam = data.families.find((f) => f.id === famId)!;
    const balance = data.invoices.filter((i) => i.familyId === famId).reduce((sum, i) => sum + outstandingOf(i), 0);
    const kids = data.students.filter((s) => s.familyId === famId).map((s) => s.name).join(' and ');
    
    if (type === 'reminder') {
      return `Hi ${fam.guardianName}, this is a gentle message from the Green Valley School Office regarding the Term 2 fees for ${kids} (${inr(balance)}). Please let us know if we can support your family in setting up a flexible monthly installment plan. No pressure!`;
    } else if (type === 'plan') {
      return `Hi ${fam.guardianName}, we noticed you have an outstanding balance. The school has approved a custom 3-part monthly installment plan for your Term 2 fees. You can view, customize, and activate this plan directly in your Parent Wallet. Let us know if you need any help!`;
    }
    return '';
  };

  const handleFamilyChange = (e: string) => {
    setSelectedFamilyId(e);
    setCustomText(getTemplateText(e, template));
  };

  const handleTemplateChange = (type: string) => {
    setTemplate(type);
    setCustomText(getTemplateText(selectedFamilyId, type));
  };

  const handleSend = async () => {
    if (!selectedFamilyId || !customText.trim()) return;
    setSending(true);
    
    const fam = data.families.find((f) => f.id === selectedFamilyId)!;
    // Strip spaces, dashes, parentheses, plus signs
    const cleanPhone = fam.phone.replace(/[^0-9]/g, '');

    // Dispatches the actual messaging client redirection!
    if (channel === 'whatsapp') {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customText)}`;
      window.open(url, '_blank');
    } else {
      const url = `sms:${cleanPhone}?body=${encodeURIComponent(customText)}`;
      window.open(url, '_blank');
    }

    // Simulate gateway API response log in Zustand store
    setTimeout(async () => {
      await sendNotification(selectedFamilyId, customText, channel);
      setSending(false);
      setSuccess(true);
      setCustomText('');
      setSelectedFamilyId('');
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const outstandingFamilies = data.families.filter((f) => {
    const balance = data.invoices.filter((i) => i.familyId === f.id).reduce((sum, i) => sum + outstandingOf(i), 0);
    return balance > 0;
  });

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell size={20} className="text-brand animate-pulse" />
          Notification Hub
        </h2>
        <p className="mt-1 text-sm text-body">
          Manage WhatsApp and SMS communications. Send empathetic reminders or configure automated alerts.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
        
        {/* Left Column: Composer */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <MessageSquareText size={16} />
              Send Communication
            </h3>
            
            {success && (
              <div className="rounded-lg bg-mint border border-mint-border text-brand-dark p-3 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 size={14} />
                Message successfully queued and dispatched!
              </div>
            )}

            {/* Select family */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1">
                Recipient Family
              </label>
              <select
                value={selectedFamilyId}
                onChange={(e) => handleFamilyChange(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg border border-line p-2 bg-white dark:bg-[#1a201d]"
              >
                <option value="">Select a family...</option>
                {outstandingFamilies.map((f) => {
                  const balance = data.invoices.filter((i) => i.familyId === f.id).reduce((sum, i) => sum + outstandingOf(i), 0);
                  return (
                    <option key={f.id} value={f.id}>
                      {f.name} · {f.guardianName} ({inr(balance)} outstanding)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Choose channel */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1.5">
                Delivery Channel
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChannel('whatsapp')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-600 border-emerald-600 text-cream'
                      : 'bg-white border-line text-muted dark:bg-[#1a201d] dark:text-cream/70 hover:border-emerald-600'
                  }`}
                >
                  WhatsApp Business API
                </button>
                <button
                  onClick={() => setChannel('sms')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-blue-600 border-blue-600 text-cream'
                      : 'bg-white border-line text-muted dark:bg-[#1a201d] dark:text-cream/70 hover:border-blue-600'
                  }`}
                >
                  Bulk SMS Gateway
                </button>
              </div>
            </div>

            {/* Select templates */}
            {selectedFamilyId && (
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1.5">
                  Templates
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTemplateChange('reminder')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      template === 'reminder'
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-white border-line text-muted dark:bg-[#1a201d] dark:text-cream/70'
                    }`}
                  >
                    Empathetic Nudge
                  </button>
                  <button
                    onClick={() => handleTemplateChange('plan')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      template === 'plan'
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-white border-line text-muted dark:bg-[#1a201d] dark:text-cream/70'
                    }`}
                  >
                    Installment Plan Pre-Approval
                  </button>
                </div>
              </div>
            )}

            {/* Custom textarea */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-brand block mb-1">
                Message Body
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Write your custom message or select a family to load a template..."
                rows={4}
                className="w-full text-xs font-sans rounded-lg border border-line p-2.5 bg-white dark:bg-[#1a201d] focus:outline-none focus:border-brand"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !selectedFamilyId || !customText.trim()}
              className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Send size={13} />
              {sending ? 'Sending via Gateway...' : 'Send Message'}
            </button>
          </div>
        </div>

        {/* Right Column: Log & Rules */}
        <div className="space-y-6">
          {/* Rules */}
          <div className="card p-5 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <Settings size={16} />
              Automation Rules
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-ink">Risk-Based Alerts</div>
                  <p className="text-[10px] text-muted mt-0.5">
                    Automatically draft reminder draft when family risk score drops below 40.
                  </p>
                </div>
                <button onClick={() => setAutoRisk(!autoRisk)} className="text-brand flex-none">
                  {autoRisk ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-muted" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line/40 pt-3">
                <div>
                  <div className="text-xs font-semibold text-ink">Automatic Due Date Alarms</div>
                  <p className="text-[10px] text-muted mt-0.5">
                    Dispatch SMS notices exactly 3 days prior to Term due dates.
                  </p>
                </div>
                <button onClick={() => setAutoDue(!autoDue)} className="text-brand flex-none">
                  {autoDue ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-muted" />}
                </button>
              </div>
            </div>
          </div>

          {/* History log */}
          <div className="card p-5 space-y-3">
            <h3 className="text-base font-bold flex items-center gap-1.5">
              <Eye size={16} />
              Sent Log
            </h3>
            
            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              {notifications.map((notif) => {
                const famName = data.families.find((f) => f.id === notif.familyId)?.name ?? 'Unknown';
                return (
                  <div key={notif.id} className="rounded border border-line bg-paper dark:bg-[#1a201d]/30 p-2.5 text-xs relative">
                    <div className="flex justify-between items-center font-bold text-ink">
                      <span>{famName}</span>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        notif.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {notif.channel}
                      </span>
                    </div>
                    <p className="text-[11px] text-body mt-1">{notif.text}</p>
                    <div className="text-[9px] text-muted mt-1.5">
                      Sent {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
