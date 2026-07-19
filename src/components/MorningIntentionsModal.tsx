import React, { useState, useEffect, useRef } from 'react';
import { Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EngineeredButton from './EngineeredButton';

interface MorningIntentionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  initialPriority1: string;
  initialPriority2: string;
  initialPriority3: string;
  onSave: (p1: string | null, p2: string | null, p3: string | null) => Promise<boolean>;
  onSkip: () => Promise<boolean>;
}

export default function MorningIntentionsModal({
  isOpen,
  onClose,
  userName,
  initialPriority1,
  initialPriority2,
  initialPriority3,
  onSave,
  onSkip
}: MorningIntentionsModalProps) {
  const [priority1, setPriority1] = useState(initialPriority1);
  const [priority2, setPriority2] = useState(initialPriority2);
  const [priority3, setPriority3] = useState(initialPriority3);
  const [isSaving, setIsSaving] = useState(false);

  // Focus ref for the first input
  const input1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPriority1(initialPriority1);
      setPriority2(initialPriority2);
      setPriority3(initialPriority3);
      
      // Auto focus on open
      setTimeout(() => {
        if (input1Ref.current) {
          input1Ref.current.focus();
        }
      }, 50);
    }
  }, [isOpen, initialPriority1, initialPriority2, initialPriority3]);

  if (!isOpen) return null;

  const firstName = userName ? userName.split(' ')[0] : 'there';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const isAllEmpty = !priority1.trim() && !priority2.trim() && !priority3.trim();

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAllEmpty) return;

    setIsSaving(true);
    try {
      const p1 = priority1.trim() || null;
      const p2 = priority2.trim() || null;
      const p3 = priority3.trim() || null;

      const success = await onSave(p1, p2, p3);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Unexpected error saving daily intentions:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      const success = await onSkip();
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Unexpected error skipping daily intentions:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="morning-intentions-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070709]/85 backdrop-blur-sm p-4 cursor-default font-sans select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-[520px] bg-[var(--tempo-bg-tertiary)] rounded-2xl border border-[var(--tempo-border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header section with sunrise vibe */}
          <div className="p-6 pb-4 flex flex-col items-center text-center border-b border-[var(--tempo-border)]/50 bg-gradient-to-b from-[#EF4444]/5 via-transparent to-transparent">
            <div className="w-12 h-12 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
              <Sun className="w-6 h-6 text-[#FBBF24]" />
            </div>
            
            <h2 className="text-lg font-bold text-[var(--tempo-text-primary)] leading-snug tracking-tight">
              Good morning, {firstName}
            </h2>
            <p className="text-xs text-[var(--tempo-text-muted)] font-medium mt-1">
              What are your top 3 priorities for today?
            </p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--tempo-text-secondary)] bg-[var(--tempo-bg-secondary)] px-2.5 py-0.5 rounded-full mt-3 border border-[var(--tempo-border)]/35">
              {formattedDate}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3.5">
              
              {/* Priority 1 */}
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center text-[10px] text-white shrink-0 font-bold font-mono">
                  #1
                </div>
                <input
                  ref={input1Ref}
                  type="text"
                  maxLength={120}
                  value={priority1}
                  onChange={(e) => setPriority1(e.target.value)}
                  placeholder="Your most important task today..."
                  className="w-full bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] px-3 py-2 text-xs rounded-xl text-[var(--tempo-text-primary)] focus:outline-none focus:border-[#F59E0B]/50 focus:ring-1 focus:ring-[#F59E0B]/20 transition-all font-medium placeholder:text-[var(--tempo-text-muted)]/65"
                />
              </div>

              {/* Priority 2 */}
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-[#60A5FA] flex items-center justify-center text-[10px] text-white shrink-0 font-bold font-mono">
                  #2
                </div>
                <input
                  type="text"
                  maxLength={120}
                  value={priority2}
                  onChange={(e) => setPriority2(e.target.value)}
                  placeholder="Second priority..."
                  className="w-full bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] px-3 py-2 text-xs rounded-xl text-[var(--tempo-text-primary)] focus:outline-none focus:border-[#60A5FA]/50 focus:ring-1 focus:ring-[#60A5FA]/20 transition-all font-medium placeholder:text-[var(--tempo-text-muted)]/65"
                />
              </div>

              {/* Priority 3 */}
              <div className="flex gap-3 items-center">
                <div className="w-6 h-6 rounded-full bg-[#F43F5E] flex items-center justify-center text-[10px] text-white shrink-0 font-bold font-mono">
                  #3
                </div>
                <input
                  type="text"
                  maxLength={120}
                  value={priority3}
                  onChange={(e) => setPriority3(e.target.value)}
                  placeholder="Third priority..."
                  className="w-full bg-[var(--tempo-bg-secondary)] border border-[var(--tempo-border)] px-3 py-2 text-xs rounded-xl text-[var(--tempo-text-primary)] focus:outline-none focus:border-[#F43F5E]/50 focus:ring-1 focus:ring-[#F43F5E]/20 transition-all font-medium placeholder:text-[var(--tempo-text-muted)]/65"
                />
              </div>

            </div>

            {/* Motivational Quote banner */}
            <div className="bg-[var(--tempo-bg-primary)]/40 border border-[var(--tempo-border)]/40 p-3 rounded-xl text-center select-none mt-1">
              <p className="text-[10px] italic text-[var(--tempo-text-muted)] tracking-wide">
                "Focus on what moves the needle."
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 items-center justify-end mt-2">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-[var(--tempo-text-secondary)] hover:text-white rounded-xl bg-transparent border border-transparent hover:bg-[var(--tempo-bg-secondary)]/50 active:scale-98 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                Skip for today
              </button>
              
              <EngineeredButton
                variant="primary"
                type="submit"
                isLoading={isSaving}
                disabled={isSaving || isAllEmpty}
                showArrow={true}
              >
                Start My Day
              </EngineeredButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
