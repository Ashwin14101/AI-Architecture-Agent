import React from 'react';
import { Undo2, Redo2, Clock, Minus, Plus, Maximize } from 'lucide-react';
import useStore from '../../store/useStore';
import './StatusBar.css';

export default function StatusBar({ onZoomIn, onZoomOut, onFitView }) {
  const zoomLevel = useStore((s) => s.zoomLevel);

  return (
    <div className="statusbar-wrapper">
      {/* Undo / Redo / History group */}
      <div className="statusbar-group">
        <button className="statusbar-btn" title="Undo" aria-label="Undo">
          <Undo2 size={14} strokeWidth={1.8} />
        </button>
        <button className="statusbar-btn" title="Redo" aria-label="Redo">
          <Redo2 size={14} strokeWidth={1.8} />
        </button>
        <button className="statusbar-btn" title="History" aria-label="History">
          <Clock size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div className="statusbar-sep" />

      {/* Zoom controls */}
      <div className="statusbar-group">
        <button className="statusbar-btn" title="Zoom Out" aria-label="Zoom Out" onClick={onZoomOut}>
          <Minus size={14} strokeWidth={1.8} />
        </button>
        <span className="statusbar-zoom-label">{zoomLevel}%</span>
        <button className="statusbar-btn" title="Zoom In" aria-label="Zoom In" onClick={onZoomIn}>
          <Plus size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div className="statusbar-sep" />

      {/* Fit view */}
      <div className="statusbar-group">
        <button className="statusbar-btn" title="Fit View" aria-label="Fit View" onClick={onFitView}>
          <Maximize size={14} strokeWidth={1.8} />
        </button>
      </div>

      {/* Collaboration avatars */}
      <div className="statusbar-avatars">
        <div className="avatar-circle" style={{ background: '#7c3aed' }}>A</div>
        <div className="avatar-circle" style={{ background: '#2563eb' }}>K</div>
      </div>
    </div>
  );
}
