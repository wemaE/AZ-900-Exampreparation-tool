import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Scale,
  AlertCircle,
  RefreshCw
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
    text: "What is the Shared Responsibility Model and what is always the customer\u2019s job?"
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
    topic: 'management_governance',
    tag: 'Governance',
    text: 'What is the difference between Azure Policy, Resource Locks, and Azure Advisor?'
  },
  {
    topic: 'cloud_concepts',
    tag: 'Pricing',
    text: 'Explain Azure pricing models — Pay-as-you-go, Reserved Instances, and CapEx vs OpEx.'
  },
  {
    topic: 'exam_logistics',
    tag: 'Exam Logistics',
    text: 'What are the Pearson OnVUE rules for headphones, scratch paper, and testing desks?'
  }
];

/** Minimal safe markdown → HTML converter for assistant bubbles */
function renderMarkdown(text: string): string {
  return (
    text
      // Headings
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Blockquotes (> line)
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr/>')
      // Unordered lists: convert consecutive - or • lines into <ul>
      .replace(/((?:^[ \t]*[-*•] .+\n?)+)/gm, (block) => {
        const items = block
          .trim()
          .split('\n')
          .map((line) => `<li>${line.replace(/^[ \t]*[-*•] /, '')}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      })
      // Ordered lists: convert consecutive N. lines into <ol>
      .replace(/((?:^[ \t]*\d+\. .+\n?)+)/gm, (block) => {
        const items = block
          .trim()
          .split('\n')
          .map((line) => `<li>${line.replace(/^[ \t]*\d+\. /, '')}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      })
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Markdown table (simple: header | cell)
      .replace(/^\|(.+)\|$/gm, (row) => {
        const cells = row
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((c) => `<td>${c.trim()}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      // Wrap table rows
      .replace(/(<tr>.*<\/tr>\n?)+/g, (block) => `<table>${block}</table>`)
      // Markdown links: [text](https://...)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-inline-link">$1</a>'
      )
      // Line breaks → paragraph spacing (double newline)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>')
  );
}

export const ChatView: React.FC<ChatViewProps> = ({ selectedTopic, onNavigateToQuiz }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  /** Auto-grow textarea up to ~5 lines */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleSend = async (
    messageText?: string,
    action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me'
  ) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
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
      setError(err instanceof Error ? err.message : 'Failed to reach AzureAce backend. Is the server running?');
    } finally {
      setLoading(false);
      // Return focus to textarea after response
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionChip = (
    action: 'simplify' | 'example' | 'compare' | 'test_me',
    lastMsg: ChatMessage
  ) => {
    if (action === 'test_me') {
      onNavigateToQuiz(selectedTopic === 'all' ? 'cloud_concepts' : selectedTopic, lastMsg.content.substring(0, 80));
      return;
    }

    const snippet = lastMsg.content.substring(0, 70).replace(/[#*]/g, '').trim();
    const map: Record<string, string> = {
      simplify: `Can you simplify: "${snippet}..." for a beginner?`,
      example: `Give me a real-world analogy for: "${snippet}..."`,
      compare: `Compare the main concepts in: "${snippet}..." against their alternatives.`
    };

    handleSend(map[action] || snippet, action);
  };

  /** Source label helper */
  const sourceLabel = (type: string) => {
    if (type === 'official') return 'MS Learn';
    if (type === 'exam_logistics') return 'OnVUE Logistics';
    if (type === 'video_manifest') return 'Video Guide';
    return 'Study Notes';
  };

  return (
    <div className="chat-window">
      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="messages-area" role="log" aria-live="polite" aria-label="Chat conversation">
        {messages.length === 0 ? (
          <div className="welcome-hero">
            <div className="welcome-banner">
              <div className="welcome-badge">
                <Sparkles size={13} />
                <span>AZ-900 Study Buddy</span>
              </div>
              <h2 className="hero-title">Meet AzureAce, your AZ-900 Study Buddy</h2>
              <p className="hero-desc">
                Grounded in the official Microsoft Learn skills outline. Ask any question, explore
                real-world analogies, and test yourself on key concepts.
              </p>
            </div>

            <div className="prompts-section">
              <div className="prompts-heading">
                <Lightbulb size={14} />
                <span>Suggested Questions</span>
              </div>
              <div className="suggested-prompts-grid">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="prompt-card"
                    onClick={() => handleSend(prompt.text)}
                    disabled={loading}
                    aria-label={`Ask: ${prompt.text}`}
                  >
                    <div className="prompt-card-header">
                      <span className="prompt-tag">{prompt.tag}</span>
                      <ArrowRight size={13} className="prompt-arrow-icon" />
                    </div>
                    <p className="prompt-text">{prompt.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div
                className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}
                aria-hidden="true"
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className="message-content">
                <div className="bubble">
                  {/* Sender & Timestamp Row */}
                  <div className="bubble-meta">
                    <span className="bubble-author">
                      {msg.role === 'user' ? 'You' : 'AzureAce'}
                    </span>
                    <span className="msg-timestamp" aria-label={`Sent at ${msg.timestamp}`}>
                      {msg.timestamp}
                    </span>
                    {msg.role === 'assistant' && msg.mode === 'demo' && (
                      <span className="demo-tag" title="Demo mode — Grounded Mock Engine">DEMO</span>
                    )}
                  </div>

                  {/* Main content — safe markdown render for assistant, plain text for user */}
                  {msg.role === 'user' ? (
                    <p className="user-text">{msg.content}</p>
                  ) : (
                    <div
                      className="md-content"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}

                  {/* Analogy card (demo mode returns this as a separate field) */}
                  {msg.analogy && (
                    <div className="analogy-card" role="complementary" aria-label="Analogy">
                      <Lightbulb className="analogy-icon" size={18} aria-hidden="true" />
                      <div className="analogy-body">
                        <div className="analogy-title">Analogy</div>
                        <div>{msg.analogy}</div>
                      </div>
                    </div>
                  )}

                  {/* Follow-up comprehension question */}
                  {msg.followUp && (
                    <div className="followup-box" role="note">
                      <HelpCircle size={15} aria-hidden="true" />
                      <span>{msg.followUp}</span>
                    </div>
                  )}

                  {/* Source citations — deduplicated by document */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="citations-container" aria-label="Sources">
                      <span className="citations-label">Sources</span>
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`source-badge ${src.sourceType}`}
                          title={`${src.sourceTitle} — ${src.sectionTitle}`}
                          aria-label={`Source: ${src.sourceTitle}`}
                        >
                          <ExternalLink size={10} aria-hidden="true" />
                          <span>{sourceLabel(src.sourceType)}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action chips — only on assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="action-chips-row" role="group" aria-label="Follow-up actions">
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('simplify', msg)}
                      disabled={loading}
                      aria-label="Simplify this explanation"
                    >
                      <Sparkles size={11} aria-hidden="true" />
                      Simplify
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('example', msg)}
                      disabled={loading}
                      aria-label="Give a real-world analogy"
                    >
                      <Lightbulb size={11} aria-hidden="true" />
                      Give example
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('compare', msg)}
                      disabled={loading}
                      aria-label="Compare with alternatives"
                    >
                      <Scale size={11} aria-hidden="true" />
                      Compare
                    </button>
                    <button
                      className="action-chip-btn"
                      onClick={() => handleActionChip('test_me', msg)}
                      disabled={loading}
                      aria-label="Go to practice quiz"
                    >
                      <ArrowRight size={11} aria-hidden="true" />
                      Test me
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="chat-message assistant" aria-live="polite" aria-busy="true">
            <div className="avatar bot-avatar" aria-hidden="true">
              <Bot size={16} />
            </div>
            <div className="bubble loading-bubble">
              <Loader2 size={15} className="spin-icon" aria-hidden="true" />
              <span>Retrieving AZ-900 notes…</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{error}</span>
            <button
              className="error-retry-btn"
              onClick={() => { setError(null); handleSend(); }}
              aria-label="Retry last message"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ──────────────────────────────────────────── */}
      <div className="chat-input-container">
        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          aria-label="Message input"
        >
          <div className="input-field-wrapper">
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="chat-input"
              placeholder="Ask an AZ-900 question… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={1000}
              rows={1}
              aria-label="Type your question"
              aria-describedby="input-hint"
            />
          </div>

          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={17} className="spin-icon" /> : <Send size={17} />}
          </button>
        </form>
        <p id="input-hint" className="input-hint">
          Enter to send · Shift+Enter for a new line · {1000 - input.length} chars remaining
        </p>
      </div>
    </div>
  );
};
