import React from 'react';
import { BookOpen, HelpCircle, Layers, Sparkles } from 'lucide-react';
import { HealthStatus } from '../types.js';

interface HeaderProps {
  health: HealthStatus | null;
  activeTab: 'chat' | 'quiz';
  setActiveTab: (tab: 'chat' | 'quiz') => void;
}

export const Header: React.FC<HeaderProps> = ({ health, activeTab, setActiveTab }) => {
  const isLive = health?.mode === 'live';

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-icon">
            <Layers size={22} />
          </div>
          <div>
            <div className="brand-title">
              AzureAce
              <span className="brand-badge">AZ-900 Study Buddy</span>
            </div>
          </div>
        </div>

        <div className="header-status">
          <div className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <BookOpen size={16} />
              Study Chat
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <HelpCircle size={16} />
              Practice Quiz
            </button>
          </div>

          <div className={`mode-indicator ${isLive ? 'mode-live' : 'mode-demo'}`}>
            <span className="status-dot"></span>
            {isLive ? (
              <>
                <Sparkles size={13} />
                Live Gemini AI
              </>
            ) : (
              'Demo Mode (Grounded Preview)'
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
