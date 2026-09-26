import React from 'react';
import { Zap } from 'lucide-react';
import useStore from '../../store/useStore';
import './AiFab.css';

export default function AiFab() {
  const toggleAiPanel = useStore((s) => s.toggleAiPanel);
  const isAiPanelOpen = useStore((s) => s.isAiPanelOpen);

  return (
    <button
      className={`ai-fab ${isAiPanelOpen ? 'open' : ''}`}
      onClick={toggleAiPanel}
      title="Ask AI"
      aria-label="Ask AI"
    >
      <Zap size={22} strokeWidth={2} fill="currentColor" />
    </button>
  );
}
