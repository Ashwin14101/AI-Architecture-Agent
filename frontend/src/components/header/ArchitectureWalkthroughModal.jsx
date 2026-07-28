import React, { useState, useEffect } from 'react';
import { X, Sparkles, Zap } from 'lucide-react';
import useStore from '../../store/useStore';
import './ArchitectureWalkthroughModal.css';

export default function ArchitectureWalkthroughModal({ onClose }) {
  const currentProject = useStore(s => s.currentProject);
  const token = useStore(s => s.token);
  
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    
    let isMounted = true;
    const fetchExplanation = async () => {
      setIsExplaining(true);
      setExplanation('');
      try {
        const res = await fetch(`http://localhost:3000/api/chat/${currentProject.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: "Explain the full architecture. Provide a high-level summary followed by component walkthrough." })
        });
        if (!res.ok) throw new Error('Failed to fetch explanation');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.text) setExplanation(prev => prev + data.text);
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setExplanation('Failed to generate explanation. Please try again.');
      } finally {
        if (isMounted) setIsExplaining(false);
      }
    };
    
    fetchExplanation();
    return () => { isMounted = false; };
  }, [currentProject, token]);

  return (
    <div className="awm-overlay" onClick={onClose}>
      <div className="awm-modal" onClick={e => e.stopPropagation()}>
        <div className="awm-header">
          <div className="awm-title">
            <Sparkles size={18} color="#8b5cf6" />
            <h3>Architecture Walkthrough</h3>
          </div>
          <button className="awm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="awm-content">
          {isExplaining && !explanation && (
            <div className="awm-loading">
              <Zap size={24} className="spin" color="#8b5cf6" />
              <p>Generating architectural explanation...</p>
            </div>
          )}
          <div className="awm-text">
            {explanation}
          </div>
          {isExplaining && explanation && (
            <div className="awm-streaming-indicator">
              <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
