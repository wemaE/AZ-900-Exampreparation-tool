import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-disclaimer">
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 600 }}>
          <Shield size={14} />
          Independent Learning Tool
        </p>
        <p>
          Not affiliated with, sponsored, or endorsed by Microsoft Corporation. All generated quiz items are practice questions, not official exam questions. Grounded references are based on public Microsoft Learn AZ-900 guidelines.
        </p>
      </div>
    </footer>
  );
};
