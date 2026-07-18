import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';
import './ApiEndpointNode.css';

const methodColors = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  DELETE: 'method-delete',
  PATCH: 'method-patch',
};

function ApiEndpointNode({ id, selected, data }) {
  const { path, method, isGroupRoot = false, apiIndex, groupKey, apisInGroup } = data;

  const [isEditing, setIsEditing] = useState(false);
  const [editPath, setEditPath] = useState(path);

  const handleSave = () => {
    const d = useStore.getState().generatedData;
    if (!d) return;

    let updatedApis = [...(d.apis || [])];

    if (isGroupRoot) {
      if (id === 'api-root') {
        useStore.setState({
          generatedData: { ...d, api_gateway_name: editPath },
          unsavedChanges: true
        });
      } else if (apisInGroup && groupKey) {
        apisInGroup.forEach(idx => {
          if (updatedApis[idx]) {
            const originalPath = updatedApis[idx].path;
            if (originalPath.startsWith(groupKey)) {
              updatedApis[idx] = {
                ...updatedApis[idx],
                path: originalPath.replace(groupKey, editPath)
              };
            }
          }
        });
        useStore.setState({
          generatedData: { ...d, apis: updatedApis },
          unsavedChanges: true
        });
      }
    } else if (apiIndex !== undefined) {
      if (updatedApis[apiIndex]) {
        updatedApis[apiIndex] = {
          ...updatedApis[apiIndex],
          path: editPath
        };
        useStore.setState({
          generatedData: { ...d, apis: updatedApis },
          unsavedChanges: true
        });
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditPath(path);
      setIsEditing(false);
    }
  };

  if (isGroupRoot) {
    return (
      <div className="api-group-node">
        <Handle type="target" position={Position.Left} className="api-handle" />
        {isEditing ? (
          <input
            type="text"
            className="api-group-title-input"
            value={editPath}
            onChange={e => setEditPath(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className="api-group-title"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Double click to edit"
          >
            {path}
          </span>
        )}
        <Handle type="source" position={Position.Right} className="api-handle" />
      </div>
    );
  }

  const badgeClass = methodColors[method?.toUpperCase()] || 'method-get';

  return (
    <div className={`api-endpoint-node ${selected ? 'api-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="api-handle" />

      <div className="api-endpoint-header">
        <span className={`method-badge ${badgeClass}`}>{method || 'GET'}</span>
        {isEditing ? (
          <input
            type="text"
            className="endpoint-path-input"
            value={editPath}
            onChange={e => setEditPath(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className="endpoint-path"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            title="Double click to edit"
          >
            {path}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="api-handle" />
    </div>
  );
}

export default memo(ApiEndpointNode);
