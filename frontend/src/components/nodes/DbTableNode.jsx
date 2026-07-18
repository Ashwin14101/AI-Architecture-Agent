import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Columns } from 'lucide-react';
import useStore from '../../store/useStore';
import './DbTableNode.css';

function DbTableNode({ id, selected, data }) {
  const { name, columns = [] } = data;

  const [isEditing, setIsEditing] = useState(false);
  const [tableName, setTableName] = useState(name);

  const handleSave = () => {
    const d = useStore.getState().generatedData;
    if (!d) return;

    const updatedSchema = (d.database_schema || []).map((t) =>
      t.name === name ? { ...t, name: tableName } : t
    );

    useStore.setState({
      generatedData: { ...d, database_schema: updatedSchema },
      unsavedChanges: true
    });

    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTableName(name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`db-table-node ${selected ? 'db-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="table-handle" />

      {/* Table Header */}
      <div className="table-header">
        <Database size={14} className="table-icon" />
        {isEditing ? (
          <input
            type="text"
            className="db-table-name-input"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className="table-name"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Double click to rename table"
          >
            {name}
          </span>
        )}
      </div>

      {/* Table Columns List */}
      <div className="table-columns">
        {columns.map((col, idx) => {
          const isPK = col.constraint?.toLowerCase().includes('primary');
          const isFK = col.constraint?.toLowerCase().includes('foreign') || col.name.endsWith('_id') || col.name.endsWith('Id');

          return (
            <div key={idx} className={`column-row ${isPK ? 'pk-row' : ''}`} style={{ position: 'relative' }}>
              {isPK && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`col-${col.name}`}
                  style={{ background: '#a78bfa', width: 8, height: 8, right: -4 }}
                />
              )}
              {isFK && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`col-${col.name}`}
                  style={{ background: '#3b82f6', width: 8, height: 8, left: -4 }}
                />
              )}
              <div className="column-left">
                {isPK && <Key size={10} className="key-icon pk-icon" />}
                {isFK && !isPK && <Key size={10} className="key-icon fk-icon" />}
                {!isPK && !isFK && <Columns size={10} className="column-icon" />}
                <span className="column-name">{col.name}</span>
              </div>
              <div className="column-right-actions">
                <span className="column-type">{col.type}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Right} className="table-handle" />
    </div>
  );
}

export default memo(DbTableNode);
