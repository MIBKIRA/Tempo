import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Lock, AlertCircle, Cookie, Trash2, Printer, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEGAL_DOCS, LegalDoc } from '../data/legalDocuments';
import { Logo } from './Logo';

interface LegalViewProps {
  docKey?: 'terms' | 'privacy' | 'cookie-policy' | 'acceptable-use' | 'account-deletion-policy';
}

export default function LegalView({ docKey = 'terms' }: LegalViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(docKey);

  const currentDoc: LegalDoc = LEGAL_DOCS[activeTab] || LEGAL_DOCS['terms'];

  const getDocIcon = (key: string) => {
    switch (key) {
      case 'terms': return FileText;
      case 'privacy': return Lock;
      case 'cookie-policy': return Cookie;
      case 'acceptable-use': return Shield;
      case 'account-deletion-policy': return Trash2;
      default: return FileText;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F1F1F1] font-sans flex flex-col selection:bg-[var(--tempo-accent-blue)] selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-[#2A2A2D] bg-[#141416]/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-8 hover:bg-[#2A2A2D] text-[#8A8A90] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2A2A2D]" />

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-5 h-5" />
            <span className="font-serif font-bold text-sm text-white tracking-wide">Tempo</span>
            <span className="text-[10px] font-mono uppercase bg-[#2A2A2D] text-[#8A8A90] px-2 py-0.5 rounded-full">Legal Center</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="p-2 rounded-8 bg-[#1C1C1F] hover:bg-[#2A2A2D] border border-[#2A2A2D] text-xs text-[#8A8A90] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            onClick={() => navigate('/delete-account')}
            className="p-2 rounded-8 bg-[#FB7185]/10 hover:bg-[#FB7185]/20 border border-[#FB7185]/20 text-xs text-[#FB7185] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deletion Request</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#8A8A90] uppercase tracking-wider px-3 mb-2 font-bold">
            Legal & Compliance Documents
          </span>

          {Object.entries(LEGAL_DOCS).map(([key, doc]) => {
            const Icon = getDocIcon(key);
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  navigate(doc.path, { replace: true });
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-10 text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--tempo-accent-blue)] text-white font-bold shadow-md'
                    : 'text-[#8A8A90] hover:text-white hover:bg-[#1C1C1F]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{doc.title}</span>
                </div>
              </button>
            );
          })}

          <div className="mt-8 p-4 rounded-12 bg-[#141416] border border-[#2A2A2D] flex flex-col gap-2">
            <span className="text-xs font-bold text-white">Need help?</span>
            <p className="text-[11px] text-[#8A8A90] leading-relaxed">
              If you have questions about our policies or wish to exercise your privacy rights under GDPR or CCPA, email us at:
            </p>
            <a
              href="mailto:support@tempo.so"
              className="text-xs font-mono text-[var(--tempo-accent-blue)] hover:underline mt-1"
            >
              support@tempo.so
            </a>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-[#141416] border border-[#2A2A2D] rounded-16 p-6 md:p-10 flex flex-col shadow-xl overflow-hidden">
          <div className="border-b border-[#2A2A2D] pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                {currentDoc.title}
              </h1>
              <span className="text-xs font-mono text-[#8A8A90] mt-1 block">
                Last Updated: {currentDoc.lastUpdated} | Version 1.0.0
              </span>
            </div>

            <span className="text-[11px] font-mono bg-[#1C1C1F] border border-[#2A2A2D] text-[#34D399] px-3 py-1 rounded-full w-fit">
              Active Policy ✓
            </span>
          </div>

          <div className="prose prose-invert prose-sm max-w-none space-y-4 text-[#CCCCCC] text-xs md:text-sm leading-relaxed">
            {currentDoc.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('# ')) return null;
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-base md:text-lg font-bold text-white border-t border-[#2A2A2D] pt-6 mt-6">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={idx} className="list-disc pl-5 space-y-1">
                    {paragraph.split('\n').map((line, lIdx) => (
                      <li key={lIdx}>{line.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          <footer className="mt-12 border-t border-[#2A2A2D] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8A90]">
            <span>Tempo Technologies Inc. © 2026</span>
            <a
              href="/delete-account"
              onClick={(e) => {
                e.preventDefault();
                navigate('/delete-account');
              }}
              className="text-[var(--tempo-accent-blue)] hover:underline flex items-center gap-1"
            >
              <span>Submit Account Deletion Request</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
