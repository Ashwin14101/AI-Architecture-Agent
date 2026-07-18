import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Loader2, Check, X, Minus } from 'lucide-react';
import './AgentNode.css';

const statusConfig = {
  idle: { dot: 'status-idle', label: 'Idle', Icon: Minus },
  running: { dot: 'status-running', label: 'Running', Icon: Loader2 },
  success: { dot: 'status-success', label: 'Success', Icon: Check },
  error: { dot: 'status-error', label: 'Failed', Icon: X },
};

function AgentNode({ data }) {
  const {
    label,
    agentId,
    category = 'ingestion',
    icon: IconComponent,
    status = 'idle',
    inputs = [],
    outputs = [],
    latency,
    model,
    tokens,
  } = data;

  const statusInfo = statusConfig[status] || statusConfig.idle;
  const StatusIcon = statusInfo.Icon;

  return (
    <div className={`agent-node cat-${category} ${status === 'running' ? 'is-running' : ''}`}>
      {/* Left accent stripe */}
      <div className={`agent-node-accent cat-${category}`} />

      {/* Input handle */}
      <Handle type="target" position={Position.Top} className="agent-handle" />

      {/* Header */}
      <div className="agent-node-header">
        <div className="agent-node-title-row">
          {IconComponent && (
            <span className="agent-node-icon">
              <IconComponent size={16} strokeWidth={1.8} />
            </span>
          )}
          <span className="agent-node-title">{label}</span>
        </div>
        <div className={`agent-node-status ${statusInfo.dot}`}>
          <StatusIcon
            size={12}
            strokeWidth={2}
            className={status === 'running' ? 'spin-icon' : ''}
          />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* I/O Section */}
      {(inputs.length > 0 || outputs.length > 0) && (
        <div className="agent-node-io">
          {inputs.length > 0 && (
            <div className="io-row">
              <span className="io-label">In:</span>
              <div className="io-pills">
                {inputs.map((inp, i) => (
                  <span key={i} className="io-pill">{inp}</span>
                ))}
              </div>
            </div>
          )}
          {outputs.length > 0 && (
            <div className="io-row">
              <span className="io-label">Out:</span>
              <div className="io-pills">
                {outputs.map((out, i) => (
                  <span key={i} className="io-pill">{out}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Metrics */}
      {(latency || model || tokens) && (
        <div className="agent-node-footer">
          {latency && <span className="metric">{latency}</span>}
          {model && <span className="metric">{model}</span>}
          {tokens && <span className="metric">{tokens}</span>}
        </div>
      )}

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} className="agent-handle" />
    </div>
  );
}

export default memo(AgentNode);
