'use client';

import React, { useState } from 'react';

export default function TwoFactorEnroll({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'recovery' | 'success'>('intro');
  const [code, setCode] = useState('');
  const [recoveryKey] = useState('CP-' + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('').toUpperCase());

  const handleVerify = () => {
    if (code.length === 6) {
      setStep('recovery');
    }
  };

  const downloadRecovery = () => {
    const blob = new Blob([`ChronoPay 2FA Recovery Key\n\n${recoveryKey}\n\nKeep this key safe and private.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chronopay-2fa-recovery-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStep('success');
  };

  interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }

  const Button = ({ children, onClick, disabled = false, className = '' }: ButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-6 px-6 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10 active:bg-cyan-500/20'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Set Up Two-Factor Authentication</h2>
        <p className="text-slate-400">Add an extra layer of security to your ChronoPay account.</p>
      </div>

      {step === 'intro' && (
        <>
          <p className="helper-text mb-8 text-center">We'll guide you through setting up 2FA using a time-based one-time password app.</p>
          <Button onClick={() => setStep('qr')} className="bg-cyan-500 hover:bg-cyan-400 text-black">Begin Setup</Button>
        </>
      )}

      {step === 'qr' && (
        <div className="text-center">
          <div className="mx-auto w-56 h-56 bg-white rounded-2xl flex items-center justify-center mb-6 border-8 border-slate-800">
            <div className="text-slate-900 font-mono text-xs">SCAN QR CODE WITH AUTHENTICATOR APP</div>
          </div>
          <p className="helper-text mb-6">Scan this QR code with Google Authenticator, Authy, or another TOTP app.</p>
          <Button onClick={() => setStep('verify')}>I Have Scanned It</Button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <label className="block text-sm mb-3 font-medium">Enter the 6-digit code from your authenticator app</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-950 border border-slate-700 rounded-xl py-6 focus:border-cyan-400 focus:outline-none"
            placeholder="000000"
          />
          <Button onClick={handleVerify} disabled={code.length !== 6} className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-black">
            Verify Code
          </Button>
        </div>
      )}

      {step === 'recovery' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Save Your Recovery Key</h3>
          <div className="bg-slate-950 p-5 rounded-xl font-mono text-sm border border-slate-700 mb-6 break-all">
            {recoveryKey}
          </div>
          <Button onClick={downloadRecovery} className="mb-4 bg-white text-black hover:bg-white/90">Download Recovery Key</Button>
          <p className="text-xs text-slate-500 text-center">Store this key safely. It is the only way to recover access if you lose your device.</p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-6">✅</div>
          <h3 className="text-2xl font-semibold mb-3">2FA Enabled Successfully</h3>
          <p className="text-slate-400 mb-8">Your account is now protected with two-factor authentication.</p>
          <Button onClick={onComplete} className="bg-cyan-500 hover:bg-cyan-400 text-black">Return to Settings</Button>
        </div>
      )}
    </div>
  );
}