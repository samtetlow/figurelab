import React, { useState, useEffect } from 'react';

interface DisclaimerDialogProps {
  onAccept: (username: string) => void;
}

export default function DisclaimerDialog({ onAccept }: DisclaimerDialogProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleAccept = () => {
    if (!username.trim()) {
      setError('Please enter your name to continue');
      return;
    }

    const timestamp = new Date().toISOString();
    const acceptanceRecord = {
      username: username.trim(),
      timestamp,
      ip: 'client',
      userAgent: navigator.userAgent
    };

    // Log to console (in production, send to backend)
    console.log('[LEGAL ACCEPTANCE]', JSON.stringify(acceptanceRecord, null, 2));

    // Store in localStorage as backup
    try {
      const existingLogs = JSON.parse(localStorage.getItem('figurelab_legal_acceptances') || '[]');
      existingLogs.push(acceptanceRecord);
      localStorage.setItem('figurelab_legal_acceptances', JSON.stringify(existingLogs));
      localStorage.setItem('figurelab_disclaimer_accepted', 'true');
    } catch (e) {
      console.error('Failed to log acceptance:', e);
    }

    onAccept(username.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to FigureLab</h2>
          <p className="text-slate-600">Professional figure and diagram editor</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 space-y-4 max-h-96 overflow-y-auto border border-slate-200">
          <h3 className="font-semibold text-lg text-slate-900">Important Legal Notice</h3>
          
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p className="font-medium text-base text-rose-700">
              ⚠️ Copyright and Intellectual Property Rights Agreement
            </p>
            
            <p>
              By using FigureLab, you affirm and warrant that:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>You own</strong> or have <strong>obtained all necessary rights, licenses, and permissions</strong> for any content (including but not limited to images, text, graphics, designs, data, and other materials) that you upload, create, modify, or share using this platform.
              </li>
              <li>
                <strong>You will not use</strong> copyrighted, trademarked, or proprietary content belonging to others without explicit written authorization.
              </li>
              <li>
                <strong>You assume full legal responsibility</strong> for any intellectual property infringement, copyright violation, or unauthorized use of third-party content.
              </li>
              <li>
                <strong>You indemnify and hold harmless</strong> FigureLab, its developers, and affiliates from any claims, damages, or legal actions arising from your use of unauthorized content.
              </li>
            </ul>

            <p className="pt-3 font-medium border-t border-slate-300">
              By clicking "Yes, I Understand and Agree" below, you acknowledge that you have read, understood, and agree to comply with these terms. Your acceptance will be logged with a timestamp for legal compliance.
            </p>

            <p className="text-xs text-slate-500 italic">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
              Your Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAccept()}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              autoFocus
            />
            {error && <p className="text-rose-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            ✓ Yes, I Understand and Agree
          </button>

          <p className="text-xs text-center text-slate-500">
            This agreement will be logged with your name, timestamp, and browser information.
          </p>
        </div>
      </div>
    </div>
  );
}

