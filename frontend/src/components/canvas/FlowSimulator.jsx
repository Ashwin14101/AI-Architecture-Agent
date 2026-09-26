import React, { useState, useEffect } from 'react';
import { Play, Square, FastForward } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import './FlowSimulator.css';

export default function FlowSimulator({ nodes, edges, setEdges, setNodes }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!isPlaying) {
      // Reset styles when stopped
      setEdges(es => es.map(e => ({ ...e, animated: false, style: { stroke: '#94a3b8', strokeWidth: 1.5 } })));
      setNodes(ns => ns.map(n => ({ ...n, style: { ...n.style, opacity: 1, filter: 'none' } })));
      return;
    }

    const timer = setInterval(() => {
      setStep(s => {
        const nextStep = s + 1;
        if (nextStep > edges.length + 1) {
          setIsPlaying(false);
          return 0;
        }
        return nextStep;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isPlaying, edges.length, setEdges, setNodes]);

  useEffect(() => {
    if (!isPlaying || step === 0) return;

    // Highlight edges up to current step
    setEdges(es => es.map((e, i) => {
      if (i === step - 1) {
        return { 
          ...e, 
          animated: true, 
          style: { stroke: '#3b82f6', strokeWidth: 3, filter: 'drop-shadow(0 0 5px rgba(59,130,246,0.5))' } 
        };
      }
      if (i < step - 1) {
        return { ...e, animated: true, style: { stroke: '#10b981', strokeWidth: 2 } };
      }
      return { ...e, animated: false, style: { stroke: '#cbd5e1', strokeWidth: 1, opacity: 0.3 } };
    }));

    // Highlight active nodes
    const activeEdges = edges.slice(0, step);
    const activeNodeIds = new Set();
    activeEdges.forEach(e => {
      activeNodeIds.add(e.source);
      activeNodeIds.add(e.target);
    });

    if (activeNodeIds.size > 0) {
      setNodes(ns => ns.map(n => {
        if (activeNodeIds.has(n.id)) {
          return { ...n, style: { ...n.style, opacity: 1, filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.3))' } };
        }
        return { ...n, style: { ...n.style, opacity: 0.4, filter: 'grayscale(1)' } };
      }));
    }
  }, [step, isPlaying, edges, setEdges, setNodes]);

  return (
    <div className="flow-simulator">
      <div className="fs-controls">
        {!isPlaying ? (
          <button className="fs-btn play" onClick={() => { setIsPlaying(true); setStep(1); }}>
            <Play size={16} fill="currentColor" /> <span>Simulate Data Flow</span>
          </button>
        ) : (
          <>
            <button className="fs-btn stop" onClick={() => { setIsPlaying(false); setStep(0); }}>
              <Square size={16} fill="currentColor" /> <span>Stop</span>
            </button>
            <div className="fs-progress">
              Step {step} of {edges.length > 0 ? edges.length + 1 : 0}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
