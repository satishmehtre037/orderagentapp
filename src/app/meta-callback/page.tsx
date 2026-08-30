'use client';

import React, { useEffect } from 'react';

export default function MetaCallbackPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error_description') || urlParams.get('error');

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'META_AUTH_CALLBACK',
            code,
            error,
          },
          '*'
        );
        window.close();
      } else {
        window.location.href = `/onboarding${code ? `?code=${encodeURIComponent(code)}` : ''}`;
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-6 font-sans text-center">
      <div className="space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-base font-bold">Connecting Meta WhatsApp...</h2>
        <p className="text-xs text-gray-400">Completing secure verification and closing window...</p>
      </div>
    </div>
  );
}
