import React from 'react';
import {
  GitFork, LayoutGrid, Columns3,
  MousePointer2, Hand,
  Diamond, Copy,
  ArrowRight, Type,
  Link2, RefreshCw,
  Pencil, Layers,
  Sparkles, SquareDashed, PlusCircle
} from 'lucide-react';
import useStore from '../../store/useStore';
import './Toolbar.css';

const toolGroups = [
  {
    id: 'modes',
    tools: [
      { id: 'flowchart', icon: GitFork, label: 'Flowchart' },
      { id: 'table', icon: LayoutGrid, label: 'Table' },
      { id: 'board', icon: Columns3, label: 'Board' },
    ],
  },
  {
    id: 'navigate',
    tools: [
      { id: 'select', icon: MousePointer2, label: 'Select' },
      { id: 'pan', icon: Hand, label: 'Pan' },
    ],
  },
  {
    id: 'shapes',
    tools: [
      { id: 'shape', icon: Diamond, label: 'Shape' },
      { id: 'duplicate', icon: Copy, label: 'Duplicate' },
    ],
  },
  {
    id: 'annotate',
    tools: [
      { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
      { id: 'text', icon: Type, label: 'Text' },
    ],
  },
  {
    id: 'connect',
    tools: [
      { id: 'link', icon: Link2, label: 'Link' },
      { id: 'cycle', icon: RefreshCw, label: 'Cycle' },
    ],
  },
  {
    id: 'draw',
    tools: [
      { id: 'pen', icon: Pencil, label: 'Draw' },
      { id: 'section', icon: Layers, label: 'Section' },
    ],
  },
  {
    id: 'ai',
    tools: [
      { id: 'ai-agent', icon: Sparkles, label: 'AI Agent', isAi: true },
      { id: 'frame', icon: SquareDashed, label: 'Frame' },
      { id: 'add', icon: PlusCircle, label: 'Add' },
    ],
  },
];

export default function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const setActiveTool = useStore((s) => s.setActiveTool);

  return (
    <div className="toolbar-wrapper">
      {toolGroups.map((group, groupIdx) => (
        <React.Fragment key={group.id}>
          {groupIdx > 0 && <div className="toolbar-divider" />}
          <div className="toolbar-group">
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  className={`toolbar-btn ${isActive ? 'active' : ''} ${tool.isAi ? 'ai-tool' : ''}`}
                  onClick={() => setActiveTool(tool.id)}
                  title={tool.label}
                  aria-label={tool.label}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {tool.isAi && <span className="ai-sparkle-badge" />}
                </button>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
