import React from 'react';
import { Layers } from 'lucide-react';
import './LayerFilterBar.css';

export default function LayerFilterBar({ activeLayers, setActiveLayers }) {
  const layers = [
    { id: 'presentation', label: 'Presentation Layer', color: '#3b82f6' },
    { id: 'application', label: 'Application Layer', color: '#10b981' },
    { id: 'data', label: 'Data Layer', color: '#f59e0b' },
  ];

  const toggleLayer = (id) => {
    if (activeLayers.includes(id)) {
      setActiveLayers(activeLayers.filter(l => l !== id));
    } else {
      setActiveLayers([...activeLayers, id]);
    }
  };

  return (
    <div className="layer-filter-bar">
      <div className="lfb-icon"><Layers size={14} /></div>
      <span className="lfb-title">Layers:</span>
      {layers.map(l => (
        <button 
          key={l.id} 
          className={`lfb-btn ${activeLayers.includes(l.id) ? 'active' : ''}`}
          onClick={() => toggleLayer(l.id)}
          style={{ '--layer-color': l.color }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
