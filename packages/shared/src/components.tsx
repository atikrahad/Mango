import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from './toastStore';

// 1. Toast Notification Component
export const Toast: React.FC = () => {
  const { message, type, hideToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !message) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes toast-slide-in {
          0% {
            transform: translateY(1.5rem) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-toast-slide-in {
          animation: toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] animate-toast-slide-in max-w-sm">
        <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 border backdrop-blur-md transition-all duration-300 ${
          type === 'success' ? 'bg-slate-900/95 border-emerald-500/20 text-emerald-400' :
          type === 'error' ? 'bg-slate-900/95 border-red-500/20 text-red-400' :
          'bg-slate-900/95 border-amber-500/20 text-amber-400'
        }`}>
          <div className="shrink-0">
            {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
            {type === 'info' && <Info className="w-4 h-4 text-amber-400" />}
          </div>
          <div className="flex-grow pr-2 text-slate-100 font-semibold leading-relaxed">
            {message}
          </div>
          <button 
            onClick={hideToast}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

// 2. Portal Header Component
interface PortalHeaderProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
  actionHref?: string;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onActionClick,
  actionHref,
}) => {
  const renderAction = () => {
    if (!actionLabel) return null;

    const className = "bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer";

    if (actionHref) {
      return (
        <a href={actionHref} className={className}>
          {actionIcon} {actionLabel}
        </a>
      );
    }

    return (
      <button onClick={onActionClick} className={className}>
        {actionIcon} {actionLabel}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <a href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shrink-0">
          🥭
        </a>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            {subtitle}
          </p>
        </div>
      </div>
      {renderAction()}
    </header>
  );
};

// 3. Portal Lock Screen Component
interface PortalLockScreenProps {
  title: string;
  description: React.ReactNode;
}

export const PortalLockScreen: React.FC<PortalLockScreenProps> = ({ title, description }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center text-3xl shadow-lg">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h2 className="font-extrabold text-2xl text-slate-100 mb-2">{title}</h2>
        <div className="text-sm text-slate-400 leading-relaxed">
          {description}
        </div>
      </div>
      <a 
        href="/"
        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
      >
        Return to Catalog
      </a>
    </div>
  );
};
