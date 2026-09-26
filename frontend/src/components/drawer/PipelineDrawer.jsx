import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Play, Square, Trash2, Download } from 'lucide-react';
import useStore from '../../store/useStore';
import './PipelineDrawer.css';

export default function PipelineDrawer() {
  const isOpen = useStore((s) => s.isDrawerOpen);
  const toggleDrawer = useStore((s) => s.toggleDrawer);
  const pipelineStatus = useStore((s) => s.pipelineStatus);
  const pipelineProgress = useStore((s) => s.pipelineProgress);
  const currentAgent = useStore((s) => s.currentAgent);
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);
  const qualityScore = useStore((s) => s.qualityScore);
  const startPipeline = useStore((s) => s.startPipeline);
  const disconnectSocket = useStore((s) => s.disconnectSocket);

  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Clean up WebSocket connection when component unmounts
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  const isRunning = pipelineStatus === 'running';

  const handleRunPipeline = () => {
    startPipeline();
  };

  const handleStopPipeline = () => {
    disconnectSocket();
    useStore.getState().setPipelineStatus('idle');
    useStore.getState().addLog({ level: 'warn', message: 'Pipeline stopped by user.' });
  };

  return (
    <div className={`drawer-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Toggle header */}
      <button className="drawer-toggle" onClick={toggleDrawer}>
        <div className="drawer-toggle-left">
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          <span className="drawer-toggle-label">Pipeline Control Drawer</span>
          {isRunning && (
            <span className="drawer-running-badge">
              <span className="running-dot" />
              Running
            </span>
          )}
        </div>
        {qualityScore !== null && (
          <span className="drawer-quality-score">
            Overall Security Score: <strong>{qualityScore}%</strong>
          </span>
        )}
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="drawer-content">
          {/* Top row: Run button + progress */}
          <div className="drawer-controls">
            <button
              className={`run-btn ${isRunning ? 'stopping' : ''}`}
              onClick={isRunning ? handleStopPipeline : handleRunPipeline}
            >
              {isRunning ? (
                <>
                  <Square size={16} fill="currentColor" />
                  Stop Pipeline
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Run Pipeline
                </>
              )}
            </button>

            <div className="progress-section">
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${pipelineStatus}`}
                  style={{ width: `${pipelineProgress}%` }}
                />
              </div>
              <span className="progress-label">
                {currentAgent
                  ? `Running Agent: ${currentAgent}`
                  : pipelineStatus === 'completed'
                  ? 'Pipeline Successful'
                  : pipelineStatus === 'failed'
                  ? 'Pipeline Failed'
                  : `${pipelineProgress}%`}
              </span>
            </div>
          </div>

          {/* Log console */}
          <div className="log-console">
            <div className="log-console-header">
              <span className="log-console-title">Execution Console Logs</span>
              <div className="log-actions">
                <button className="log-action-btn" onClick={clearLogs} title="Clear Logs">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="log-console-body">
              {logs.length === 0 ? (
                <span className="log-empty">No logs yet. Run the pipeline to start.</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`log-entry level-${log.level || 'info'}`}>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-level">{(log.level || 'info').toUpperCase()}</span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
