import React, { useState } from 'react';
import { ShieldAlert, FileText, Check, Lock, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { LEGAL_VERSIONS } from '../config/legalVersions';
import { Logo } from './Logo';

interface ReconsentModalProps {
  userId: string;
  outdatedPolicies: string[]; // e.g. ['terms_of_service', 'privacy_policy']
  onConsentsRecorded: () => void;
}

export const getPolicyVersion = (policyType: string): string => {
  switch (policyType) {
    case 'privacy_policy':
      return LEGAL_VERSIONS.privacyPolicy.version;
    case 'terms_of_service':
      return LEGAL_VERSIONS.termsOfService.version;
    case 'cookie_policy':
      return LEGAL_VERSIONS.cookiePolicy.version;
    case 'acceptable_use_policy':
      return LEGAL_VERSIONS.acceptableUsePolicy.version;
    case 'account_deletion_policy':
      return LEGAL_VERSIONS.accountDeletionPolicy.version;
    default:
      return '1.0.0';
  }
};

export const getPolicyTitle = (policyType: string): string => {
  switch (policyType) {
    case 'terms_of_service':
      return 'Terms of Service';
    case 'privacy_policy':
      return 'Privacy Policy';
    case 'cookie_policy':
      return 'Cookie Policy';
    case 'acceptable_use_policy':
      return 'Acceptable Use Policy';
    case 'account_deletion_policy':
      return 'Account & Data Deletion Policy';
    default:
      return policyType;
  }
};

export default function ReconsentModal({ userId, outdatedPolicies, onConsentsRecorded }: ReconsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePolicies = outdatedPolicies && outdatedPolicies.length > 0
    ? outdatedPolicies
    : ['terms_of_service', 'privacy_policy'];

  const handleAcceptAll = async () => {
    if (!agreed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const rowsToInsert = activePolicies.map((policyType) => ({
        user_id: userId,
        policy_type: policyType,
        policy_version: getPolicyVersion(policyType),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        accepted_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('user_consents').insert(rowsToInsert);

      if (error) {
        throw error;
      }

      onConsentsRecorded();
    } catch (err: unknown) {
      console.error('Failed to log updated consents:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || 'Failed to record policy agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#141416] border border-[#2A2A2D] rounded-20 p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-fade-in relative overflow-hidden">
        {/* Glow effect header */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--tempo-accent-blue)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-12 bg-[var(--tempo-accent-blue)]/10 border border-[var(--tempo-accent-blue)]/20 flex items-center justify-center text-[var(--tempo-accent-blue)] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">
              Updated Terms & Privacy Policy
            </h2>
            <span className="text-xs font-mono text-[#8A8A90]">
              Action Required to Continue Using Tempo
            </span>
          </div>
        </div>

        <div className="p-4 rounded-12 bg-[#0E0E10] border border-[#2A2A2D] flex flex-col gap-2 text-xs text-[#CCCCCC] leading-relaxed">
          <p>
            We have updated our{' '}
            {activePolicies.map((policyType, index) => {
              const title = getPolicyTitle(policyType);
              const ver = getPolicyVersion(policyType);
              const isLast = index === activePolicies.length - 1;
              const isSecondToLast = index === activePolicies.length - 2;
              const separator = isLast ? '' : isSecondToLast ? ' and ' : ', ';
              return (
                <React.Fragment key={policyType}>
                  <strong>{title}</strong> (v<span className="font-mono text-[var(--tempo-accent-blue)] font-bold">{ver}</span>){separator}
                </React.Fragment>
              );
            })}{' '}
            to clarify data handling, age requirements (13+), and account deletion procedures.
          </p>
          <p className="text-[#8A8A90]">
            Please review the updated documents before accepting to proceed into your workspace.
          </p>
        </div>

        {/* Links to documents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-10 bg-[#1C1C1F] border border-[#2A2A2D] hover:border-[var(--tempo-accent-blue)] transition-colors flex items-center justify-between text-xs text-white"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--tempo-accent-blue)]" />
              <span>Terms of Service</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8A90]" />
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-10 bg-[#1C1C1F] border border-[#2A2A2D] hover:border-[var(--tempo-accent-blue)] transition-colors flex items-center justify-between text-xs text-white"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#34D399]" />
              <span>Privacy Policy</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8A90]" />
          </a>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-8 bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185] text-xs">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-[#2A2A2D] pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-[#2A2A2D] bg-[#0D0D0F] text-[var(--tempo-accent-blue)] focus:ring-0 accent-[var(--tempo-accent-blue)]"
            />
            <span className="text-xs text-white">
              I have read and agree to the updated <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
            </span>
          </label>

          <button
            onClick={handleAcceptAll}
            disabled={!agreed || isSubmitting}
            className="w-full py-3 rounded-10 bg-[var(--tempo-accent-blue)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving consent...</span>
            ) : (
              <>
                <span>I Agree — Continue to Tempo</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
