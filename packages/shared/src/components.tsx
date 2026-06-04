import React from 'react';
import { Lock } from 'lucide-react';
import { useToastStore } from './toastStore';

// 1. Toast Notification Component
export const Toast: React.FC = () => {
  const { message, type } = useToastStore();

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div className={`px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 border ${
        type === 'success' ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' :
        type === 'error' ? 'bg-slate-900 border-red-500/30 text-red-400' :
        'bg-slate-900 border-amber-500/30 text-amber-400'
      }`}>
        <span className="text-base">
          {type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}
        </span>
        <span>{message}</span>
      </div>
    </div>
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
