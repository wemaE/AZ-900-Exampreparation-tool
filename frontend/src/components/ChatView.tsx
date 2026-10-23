import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Scale
} from 'lucide-react';
import { ChatMessage, TopicDomain } from '../types.js';
import { sendChatMessage } from '../services/api.js';

interface ChatViewProps {
  selectedTopic: TopicDomain;
  onNavigateToQuiz: (topic: string, context?: string) => void;
}

const SUGGESTED_PROMPTS = [
  {
    topic: 'cloud_concepts',
    tag: 'Cloud Concepts',
    text: 'What is the Shared Responsibility Model and what is always the customer’s job?'
  },
  {
    topic: 'cloud_concepts',
    tag: 'Cloud Concepts',
    text: 'Explain the difference between IaaS, PaaS, and SaaS with an everyday analogy.'
  },
  {
    topic: 'architecture_services',
    tag: 'Architecture & Services',
    text: 'How do Azure Availability Zones and Regions protect workloads from outages?'
  },
  {
    topic: 'exam_logistics',
    tag: 'Exam Logistics',
    text: 'What are the Pearson OnVUE rules for headphones, scratch paper, and testing desks?'
  }
];

export const ChatView: React.FC<ChatViewProps> = ({ selectedTopic, onNavigateToQuiz }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string, action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me') => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage(textToSend, selectedTopic, action, historyPayload);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        analogy: res.analogy,
        followUp: res.followUp,
        sources: res.sources,
        mode: res.mode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reach AzureAce backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionChip = (action: 'simplify' | 'example' | 'compare' | 'test_me', lastMsgContent: string) => {
    if (action === 'test_me') {
      onNavigateToQuiz(selectedTopic === 'all' ? 'cloud_concepts' : selectedTopic, lastMsgContent.substring(0, 80));
      return;
    }

    let followUpText = '';
    if (action === 'simplify') followUpText = `Can you simplify your explanation of: "${lastMsgContent.substring(0, 60)}..." for a beginner?`;
    if (action === 'example') followUpText = `Give me an original real-world or African-context analogy for: "${lastMsgContent.substring(0, 60)}..."`;
    if (action === 'compare') followUpText = `Compare the main concepts in: "${lastMsgContent.substring(0, 60)}..." against their alternatives.`;

    handleSend(followUpText, action);
  };

  return (
    <div className="chat-window">
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-hero">
            <div className="hero-icon">
              <Bot size={32} />
            </div>
            <h2 className="hero-title">Meet AzureAce, your AZ-900 Study Buddy</h2>
            <p className="hero-desc">
              Grounded in the official Microsoft Learn skills outline and verified exam references.
              Ask any question, explore relatable real-world analogies, and test yourself on key concepts!
            </p>

            <div className="suggested-prompts-grid">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <div
                  key={idx}
                  className="prompt-card"
                  onClick={() => handleSend(prompt.text)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(prompt.text)}
                >
                  <span className="prompt-tag">{prompt.tag}</span>
                  <p className="prompt-text">{prompt.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className="message-content">
                <div className="bubble">
                  <div
                    style={{ whiteSpace: 'pre-line' }}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />

                  {msg.analogy && (
                    <div className="analogy-card">
                      <Lightbulb className="analogy-icon" size={20} />
                      <div className="analogy-body">
                        <div className="analogy-title">Relatable Analogy</div>
                        <div>{msg.analogy}</div>
                      </div>
                    </div>
                  )}

                  {msg.followUp && (
                    <div className="followup-box">
                      <HelpCircle size={16} />
                      <span>{msg.followUp}</span>
                    </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="citations-container">
                      <span className="citations-label">Sources:</span>
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`source-badge ${src.sourceType}`}
                          title={`Source: ${src.sourceTitle} (${src.authority})`}
                        >
                          <ExternalLink size={11} />
                          <span>
                            {src.sourceType === 'official'
                              ? 'Official MS Learn'
                              : src.sourceType === 'exam_logistics'
                              ? 'OnVUE Exam Logistics'
                              : 'Study Guide Notes'}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && (
                  <div className="action-chips-row">
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('simplify', msg.content)}
                    >
                      <Sparkles size={12} />
                      Simplify
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('example', msg.content)}
                    >
                      <Lightbulb size={12} />
                      Give example
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('compare', msg.content)}
                    >
                      <Scale size={12} />
                      Compare
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('test_me', msg.content)}
                    >
                      <ArrowRight size={12} />
                      Test me
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="chat-message assistant">
            <div className="avatar bot-avatar">
              <Bot size={18} />
            </div>
            <div className="bubble">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)' }}>
                <RefreshCw size={16} className="animate-spin" />
                <span>Retrieving grounded AZ-900 notes & generating response...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fda4af',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{error}</span>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f43f5e',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => handleSend()}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="input-field-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask an AZ-900 question (e.g. 'What is the difference between LRS and GRS?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={1000}
            />
          </div>

          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
