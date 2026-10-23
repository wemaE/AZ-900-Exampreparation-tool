import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { QuizEvaluation, QuizQuestion, TopicDomain } from '../types.js';
import { fetchQuizQuestion, submitQuizAnswer } from '../services/api.js';

interface QuizViewProps {
  selectedTopic: TopicDomain;
  contextHint?: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ selectedTopic, contextHint }) => {
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = async (ctx?: string) => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setEvaluation(null);

    try {
      const q = await fetchQuizQuestion(selectedTopic, ctx || contextHint);
      setCurrentQuiz(q);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load practice question.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion(contextHint);
  }, [selectedTopic]);

  const handleSubmit = async () => {
    if (selectedOption === null || !currentQuiz || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitQuizAnswer(currentQuiz.quizId, selectedOption);
      setEvaluation(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-header">
          <span className="quiz-badge">
            Topic: {currentQuiz?.topic?.replace('_', ' ').toUpperCase() || 'AZ-900'}
          </span>
          <span className="quiz-disclaimer">
            Practice questions, not official exam questions.
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Crafting a grounded practice question for your current topic...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: '#fda4af', marginBottom: '1rem' }}>{error}</p>
            <button className="btn-primary" onClick={() => loadQuestion()}>
              Retry Question
            </button>
          </div>
        ) : currentQuiz ? (
          <div>
            <h3 className="quiz-question-text">{currentQuiz.question}</h3>

            <div className="quiz-options-list">
              {currentQuiz.options.map((option, index) => {
                const isSelected = selectedOption === index;
                let optionClass = 'quiz-option-item';

                if (evaluation) {
                  if (index === evaluation.correctOptionIndex) {
                    optionClass += ' correct';
                  } else if (isSelected && !evaluation.isCorrect) {
                    optionClass += ' incorrect';
                  }
                } else if (isSelected) {
                  optionClass += ' selected';
                }

                return (
                  <button
                    key={index}
                    className={optionClass}
                    onClick={() => !evaluation && setSelectedOption(index)}
                    disabled={Boolean(evaluation)}
                  >
                    <span className="option-letter">{optionLetters[index]}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="quiz-actions">
              {!evaluation ? (
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={selectedOption === null || submitting}
                >
                  {submitting ? 'Evaluating...' : 'Submit Answer'}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn-primary" onClick={() => loadQuestion()}>
                  Next Practice Question
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            {evaluation && (
              <div className={`quiz-feedback-box ${evaluation.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="feedback-headline">
                  {evaluation.isCorrect ? (
                    <>
                      <CheckCircle2 size={22} />
                      <span>Correct! Well done.</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={22} />
                      <span>Not quite. Let’s review why.</span>
                    </>
                  )}
                </div>

                <p className="feedback-explanation">
                  <strong>Explanation:</strong> {evaluation.explanation}
                </p>

                {evaluation.misconceptionCorrection && (
                  <div className="misconception-card">
                    <div className="misconception-title">
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Misconception Clarification
                    </div>
                    <div className="misconception-text">
                      {evaluation.misconceptionCorrection}
                    </div>
                  </div>
                )}

                {evaluation.source && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    <a
                      href={evaluation.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-badge official"
                    >
                      <ExternalLink size={12} />
                      <span>Study on Microsoft Learn: {evaluation.source.title}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
