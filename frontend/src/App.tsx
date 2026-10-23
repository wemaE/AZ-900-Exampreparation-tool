import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { TopicFilter } from './components/TopicFilter.js';
import { ChatView } from './components/ChatView.js';
import { QuizView } from './components/QuizView.js';
import { Footer } from './components/Footer.js';
import { HealthStatus, TopicDomain } from './types.js';
import { fetchHealth } from './services/api.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat');
  const [selectedTopic, setSelectedTopic] = useState<TopicDomain>('all');
  const [quizContext, setQuizContext] = useState<string | undefined>();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => {
        console.warn('Backend initial health check failed (will retry):', err);
      });
  }, []);

  const handleNavigateToQuiz = (topic: string, context?: string) => {
    setSelectedTopic((topic as TopicDomain) || 'cloud_concepts');
    setQuizContext(context);
    setActiveTab('quiz');
  };

  return (
    <div className="app-container">
      <Header
        health={health}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        <TopicFilter
          selectedTopic={selectedTopic}
          onSelectTopic={(topic) => {
            setSelectedTopic(topic);
            setQuizContext(undefined);
          }}
        />

        {activeTab === 'chat' ? (
          <ChatView
            selectedTopic={selectedTopic}
            onNavigateToQuiz={handleNavigateToQuiz}
          />
        ) : (
          <QuizView
            selectedTopic={selectedTopic}
            contextHint={quizContext}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
