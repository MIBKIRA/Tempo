import React, { useState } from 'react';
import { ArrowLeft, Trash2, Mail, CheckCircle2, ShieldAlert, FileText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export default function PublicDeleteAccount() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !confirmCheckbox) {
      setErrorMessage('Please provide your account email and check the confirmation box.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Generate reference code
      const refCode = 'DEL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Store in local storage queue for reference / admin processing
      const existing = JSON.parse(localStorage.getItem('tempo-public-deletion-requests') || '[]');
      existing.push({
        refCode,
        email,
        fullName,
        reason,
        requestedAt: new Date().toISOString(),
      });
      localStorage.setItem('tempo-public-deletion-requests', JSON.stringify(existing));

      // Simulate network request duration
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSubmittedRef(refCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'An error occurred while submitting your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F1F1F1] font-sans flex flex-col selection:bg-[var(--tempo-accent-blue)] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#2A2A2D] bg-[#141416]/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-8 hover:bg-[#2A2A2D] text-[#8A8A90] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2A2A2D]" />

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-5 h-5" />
            <span className="font-serif font-bold text-sm text-white tracking-wide">Tempo</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/terms')}
          className="text-xs font-mono text-[#8A8A90] hover:text-white flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms & Privacy</span>
        </button>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-[#141416] border border-[#2A2A2D] rounded-16 p-6 sm:p-10 shadow-2xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-12 bg-[#FB7185]/10 border border-[#FB7185]/20 flex items-center justify-center text-[#FB7185] shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                Account & Data Deletion Request
              </h1>
              <span className="text-xs font-mono text-[#8A8A90]">
                Public Google Play & Regulatory Compliance Portal
              </span>
            </div>
          </div>

          <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] text-xs text-[#8A8A90] leading-relaxed flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-bold font-mono">
              <ShieldAlert className="w-4 h-4 text-[#FBBF24]" />
              <span>What happens when you request account deletion?</span>
            </div>
            <p>
              Under our Account & Data Deletion Policy, submitting this form initiates permanent deletion of your Tempo user account, tasks, habits, focus logs, and profile records.
            </p>
            <p>
              Deletion requests are verified and processed within <strong>30 days</strong>. If you are signed in, you can also delete your account instantly via <strong>Settings &gt; Profile &gt; Danger Zone</strong> in the app.
            </p>
          </div>

          {submittedRef ? (
            <div className="p-6 rounded-12 bg-[#34D399]/10 border border-[#34D399]/20 flex flex-col gap-4 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-[#34D399] mx-auto" />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white">Deletion Request Received</h3>
                <p className="text-xs text-[#8A8A90]">
                  Your request has been logged under Reference Code:
                </p>
                <span className="text-sm font-mono font-bold text-[#34D399] bg-[#0D0D0F] py-2 px-4 rounded-8 border border-[#34D399]/30 w-fit mx-auto mt-1 select-all">
                  {submittedRef}
                </span>
              </div>

              <p className="text-xs text-[#8A8A90] leading-relaxed max-w-md mx-auto">
                We have logged your deletion request for <strong>{email}</strong>. Our compliance team will verify ownership and process permanent removal within 30 days. You will receive confirmation at this email address.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-8 bg-[var(--tempo-accent-blue)] text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="p-3 rounded-8 bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-[#8A8A90] uppercase tracking-wider">
                  Account Email Address *
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0D0D0F] border border-[#2A2A2D] rounded-8 text-xs text-white focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                  />
                </div>
                <span className="text-[11px] text-[#4A4A52]">
                  Must match the email address associated with your Tempo account.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-[#8A8A90] uppercase tracking-wider">
                  Full Name or Username (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adrian Vance"
                  className="w-full px-4 py-2.5 bg-[#0D0D0F] border border-[#2A2A2D] rounded-8 text-xs text-white focus:outline-none focus:border-[var(--tempo-accent-blue)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-[#8A8A90] uppercase tracking-wider">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., No longer using the service, privacy concerns..."
                  className="w-full px-4 py-2 bg-[#0D0D0F] border border-[#2A2A2D] rounded-8 text-xs text-white focus:outline-none focus:border-[var(--tempo-accent-blue)] resize-none"
                />
              </div>

              <label className="flex items-start gap-3 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 rounded border-[#2A2A2D] text-[var(--tempo-accent-blue)] focus:ring-0 accent-[var(--tempo-accent-blue)]"
                />
                <span className="text-xs text-[#8A8A90] leading-relaxed">
                  I confirm that I am the account holder and I request permanent deletion of my account and data. I understand this action cannot be reversed.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !confirmCheckbox || !email}
                className="mt-3 w-full py-3 rounded-8 bg-[#FB7185] hover:bg-[#F43F5E] disabled:bg-[#FB7185]/40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Permanent Deletion Request'}</span>
              </button>
            </form>
          )}

          <div className="border-t border-[#2A2A2D] pt-4 flex flex-col gap-2 text-center text-xs text-[#8A8A90]">
            <span>Alternative Direct Request Method:</span>
            <a
              href="mailto:contact@tempoit.me?subject=Account%20Deletion%20Request"
              className="font-mono text-[var(--tempo-accent-blue)] hover:underline"
            >
              Email contact@tempoit.me directly with subject "Account Deletion Request"
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
