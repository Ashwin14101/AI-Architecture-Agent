import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
}) {
  const status = data?.status || 'idle';

  // Use organic bezier path for Whimsical mind-map connections style
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const colorMap = {
    idle: '#a855f7',
    running: '#d97706',
    success: '#a855f7', // Solid Whimsical Purple
    error: '#dc2626',
    inactive: '#b5b5b0',
  };

  const edgeColor = colorMap[status] || colorMap.idle;

  return (
    <>
      {/* Main edge line without arrow heads for organic Whimsical mind map style */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: 2.2,
          strokeDasharray: status === 'running' ? '8 6' : 'none',
          animation: status === 'running' ? 'dash-flow 0.6s linear infinite' : 'none',
          transition: 'stroke 0.3s ease',
          opacity: 0.85,
          ...style,
        }}
      />
    </>
  );
}
