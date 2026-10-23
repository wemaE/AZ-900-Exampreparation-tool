import React from 'react';
import { Cloud, Server, ShieldCheck, ClipboardList, Globe } from 'lucide-react';
import { TopicDomain } from '../types.js';

interface TopicFilterProps {
  selectedTopic: TopicDomain;
  onSelectTopic: (topic: TopicDomain) => void;
}

const TOPICS = [
  { id: 'all' as TopicDomain, label: 'All Topics', icon: Globe },
  { id: 'cloud_concepts' as TopicDomain, label: '1. Cloud Concepts (25-30%)', icon: Cloud },
  { id: 'architecture_services' as TopicDomain, label: '2. Architecture & Services (35-40%)', icon: Server },
  { id: 'management_governance' as TopicDomain, label: '3. Management & Governance (30-35%)', icon: ShieldCheck },
  { id: 'exam_logistics' as TopicDomain, label: 'Exam Day Logistics (OnVUE)', icon: ClipboardList }
];

export const TopicFilter: React.FC<TopicFilterProps> = ({ selectedTopic, onSelectTopic }) => {
  return (
    <div className="topic-filter-bar" role="toolbar" aria-label="AZ-900 Exam Topics">
      {TOPICS.map((topic) => {
        const Icon = topic.icon;
        const isActive = selectedTopic === topic.id;
        return (
          <button
            key={topic.id}
            className={`topic-chip ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTopic(topic.id)}
            aria-pressed={isActive}
          >
            <Icon size={14} />
            <span>{topic.label}</span>
          </button>
        );
      })}
    </div>
  );
};
