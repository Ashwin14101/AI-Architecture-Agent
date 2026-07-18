import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Server, Database, Network, Cpu, ShieldCheck, Globe,
  Zap, Lock, Cloud, GitBranch, Box, ChevronDown
} from 'lucide-react';
import useStore from '../../store/useStore';
import './SystemComponentNode.css';

const TYPE_META = {
  'web-server':    { Icon: Globe,       gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)', accent: '#8b5cf6', badge: '#ede9fe', badgeText: '#6d28d9' },
  'database':      { Icon: Database,    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', accent: '#3b82f6', badge: '#dbeafe', badgeText: '#1d4ed8' },
  'queue':         { Icon: Zap,         gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', accent: '#f59e0b', badge: '#fef3c7', badgeText: '#92400e' },
  'cache':         { Icon: Cpu,         gradient: 'linear-gradient(135deg, #059669, #10b981)', accent: '#10b981', badge: '#d1fae5', badgeText: '#065f46' },
  'load-balancer': { Icon: ShieldCheck, gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', accent: '#06b6d4', badge: '#cffafe', badgeText: '#155e75' },
  'microservice':  { Icon: Server,      gradient: 'linear-gradient(135deg, #7c3aed, #c084fc)', accent: '#a855f7', badge: '#f3e8ff', badgeText: '#7e22ce' },
  'api':           { Icon: Network,     gradient: 'linear-gradient(135deg, #be185d, #ec4899)', accent: '#ec4899', badge: '#fce7f3', badgeText: '#9d174d' },
  'storage':       { Icon: Cloud,       gradient: 'linear-gradient(135deg, #1e40af, #60a5fa)', accent: '#60a5fa', badge: '#eff6ff', badgeText: '#1e40af' },
  'auth':          { Icon: Lock,        gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', accent: '#ef4444', badge: '#fee2e2', badgeText: '#991b1b' },
  'ci-cd':         { Icon: GitBranch,   gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', accent: '#22c55e', badge: '#dcfce7', badgeText: '#14532d' },
  'default':       { Icon: Box,         gradient: 'linear-gradient(135deg, #475569, #64748b)', accent: '#64748b', badge: '#f1f5f9', badgeText: '#334155' },
};

const ALL_TYPES = [
  'web-server', 'database', 'queue', 'cache', 'load-balancer',
  'microservice', 'api', 'storage', 'auth', 'ci-cd',
];

function SystemComponentNode({ id, selected, data }) {
  const { name, type, description } = data;
  const typeLower = (type || 'default').toLowerCase().replace(/\s+/g, '-');
  const meta = TYPE_META[typeLower] || TYPE_META['default'];
  const { Icon, gradient, accent, badge, badgeText } = meta;

  // ── Edit states ──────────────────────────────────────────────────
  const [editingName,  setEditingName]  = useState(false);
  const [editName,     setEditName]     = useState(name);
  const [editingDesc,  setEditingDesc]  = useState(false);
  const [editDesc,     setEditDesc]     = useState(description || '');
  const [showTypePick, setShowTypePick] = useState(false);
  const typePanelRef = useRef(null);

  // Keep local state in sync if store data changes externally
  useEffect(() => { setEditName(name); }, [name]);
  useEffect(() => { setEditDesc(description || ''); }, [description]);

  // Close type picker on outside click
  useEffect(() => {
    if (!showTypePick) return;
    const handler = (e) => {
      if (typePanelRef.current && !typePanelRef.current.contains(e.target)) {
        setShowTypePick(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTypePick]);

  // ── Save helpers ─────────────────────────────────────────────────
  const saveField = (field, value) => {
    const d = useStore.getState().generatedData;
    if (!d) return;
    useStore.setState({
      generatedData: {
        ...d,
        components: (d.components || []).map(c =>
          c.id === id ? { ...c, [field]: value } : c
        ),
      },
      unsavedChanges: true,
    });
  };

  const saveName = () => {
    if (editName.trim()) saveField('name', editName.trim());
    setEditingName(false);
  };

  const saveDesc = () => {
    saveField('description', editDesc.trim());
    setEditingDesc(false);
  };

  const saveType = (newType) => {
    saveField('type', newType);
    setShowTypePick(false);
  };

  return (
    <div className={`scn-card ${selected ? 'scn-selected' : ''}`} style={{ '--accent': accent, '--gradient': gradient }}>
      <Handle type="target" position={Position.Left} className="scn-handle" />

      {/* Colored top bar */}
      <div className="scn-topbar" style={{ background: gradient }} />

      {/* Icon badge */}
      <div className="scn-icon-wrap" style={{ background: gradient }}>
        <Icon size={18} color="white" strokeWidth={1.8} />
      </div>

      {/* Content */}
      <div className="scn-body">

        {/* Type badge — click to change type */}
        <div className="scn-type-wrap" ref={typePanelRef}>
          <div
            className="scn-type-badge scn-type-clickable"
            style={{ background: badge, color: badgeText }}
            onClick={(e) => { e.stopPropagation(); setShowTypePick(v => !v); }}
            title="Click to change type"
          >
            {(typeLower || 'SERVICE').toUpperCase()}
            <ChevronDown size={9} style={{ marginLeft: 3, opacity: 0.7 }} />
          </div>

          {showTypePick && (
            <div className="scn-type-picker">
              {ALL_TYPES.map(t => {
                const m = TYPE_META[t] || TYPE_META['default'];
                return (
                  <button
                    key={t}
                    className={`scn-type-option ${typeLower === t ? 'active' : ''}`}
                    style={{ '--opt-badge': m.badge, '--opt-text': m.badgeText }}
                    onClick={(e) => { e.stopPropagation(); saveType(t); }}
                  >
                    <m.Icon size={11} />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Name — double-click to edit */}
        {editingName ? (
          <input
            type="text"
            className="scn-name-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditName(name); setEditingName(false); } }}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <h4
            className="scn-name"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            title="Double-click to rename"
          >
            {name}
          </h4>
        )}

        {/* Description — click to edit */}
        {editingDesc ? (
          <textarea
            className="scn-desc-input"
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            onBlur={saveDesc}
            onKeyDown={e => { if (e.key === 'Escape') { setEditDesc(description || ''); setEditingDesc(false); } }}
            onClick={e => e.stopPropagation()}
            autoFocus
            rows={2}
          />
        ) : (
          <p
            className="scn-desc scn-desc-editable"
            onClick={(e) => { e.stopPropagation(); setEditingDesc(true); }}
            title="Click to edit description"
          >
            {description || <span className="scn-desc-placeholder">Click to add description…</span>}
          </p>
        )}
      </div>

      {/* Glow on hover */}
      <div className="scn-glow" style={{ background: gradient }} />

      <Handle type="source" position={Position.Right} className="scn-handle" />
    </div>
  );
}

export default memo(SystemComponentNode);
