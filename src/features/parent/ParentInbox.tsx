import { useState, useRef, useEffect } from 'react';
import { Bell, MailOpen, MessageSquare, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ParentInboxProps {
  familyId: string;
}

export function ParentInbox({ familyId }: ParentInboxProps) {
  const notifications = useAppStore((s) => s.notifications.filter((n) => n.familyId === familyId));
  const markAsRead = useAppStore((s) => s.markNotificationsAsRead);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Click outside to close dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Mark all read when opened
      markAsRead(familyId);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, familyId, markAsRead]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full border border-line bg-white dark:bg-[#1a201d] text-ink hover:bg-paper2 dark:hover:bg-[#202723] transition-colors cursor-pointer"
        title="Inbox Alerts"
      >
        <Bell size={16} className={unreadCount > 0 ? 'animate-bounce text-brand' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid place-items-center h-4 w-4 rounded-full bg-terra text-white text-[9px] font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#151a17]/95 border border-line rounded-xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          {/* Header */}
          <div className="bg-brand text-cream p-3 flex justify-between items-center border-b border-line/35">
            <span className="text-xs font-bold uppercase tracking-wider">Inbox Notifications</span>
            <span className="text-[10px] bg-brand-dark px-2 py-0.5 rounded-full font-semibold">
              {notifications.length} Total
            </span>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-line/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                <MailOpen size={24} className="text-muted/60" />
                No messages yet. We'll update you here on invoice balances or plans.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 text-xs text-ink hover:bg-paper dark:hover:bg-[#202723]/30 transition-colors flex gap-2.5 items-start ${
                    !n.read ? 'bg-mint/30 dark:bg-mint/5' : ''
                  }`}
                >
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-peach text-terra-dark mt-0.5">
                    <MessageSquare size={12} />
                  </span>
                  <div className="space-y-1">
                    <p className="leading-relaxed whitespace-pre-line text-ink">{n.text}</p>
                    <div className="flex items-center gap-1 text-[9px] text-muted">
                      <Clock size={9} />
                      <span>
                        {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
