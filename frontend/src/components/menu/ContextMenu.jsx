import React, { useEffect, useRef } from 'react';
import {
  Play, RotateCcw, Copy, Trash2, Settings2, Eye, FileText, Link2
} from 'lucide-react';
import useStore from '../../store/useStore';
import './ContextMenu.css';

const menuItems = [
  { id: 'run', label: 'Run Agent', icon: Play, shortcut: '⌘R' },
  { id: 'retry', label: 'Retry Agent', icon: RotateCcw },
  { type: 'divider' },
  { id: 'view-output', label: 'View Output', icon: Eye },
  { id: 'view-logs', label: 'View Logs', icon: FileText },
  { type: 'divider' },
  { id: 'duplicate', label: 'Duplicate', icon: Copy, shortcut: '⌘D' },
  { id: 'connect', label: 'Connect To...', icon: Link2 },
  { id: 'configure', label: 'Configure', icon: Settings2 },
  { type: 'divider' },
  { id: 'delete', label: 'Delete', icon: Trash2, shortcut: '⌫', danger: true },
];

export default function ContextMenu() {
  const contextMenu = useStore((s) => s.contextMenu);
  const hideContextMenu = useStore((s) => s.hideContextMenu);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideContextMenu();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') hideContextMenu();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [hideContextMenu]);

  if (!contextMenu) return null;

  const handleAction = (action) => {
    console.log(`Action: ${action} on node: ${contextMenu.nodeId}`);
    hideContextMenu();
  };

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {menuItems.map((item, i) =>
        item.type === 'divider' ? (
          <div key={`div-${i}`} className="context-menu-divider" />
        ) : (
          <button
            key={item.id}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => handleAction(item.id)}
          >
            <item.icon size={14} strokeWidth={1.8} />
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
