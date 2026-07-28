import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import AgentCanvas from './components/canvas/AgentCanvas';
import ProjectHeader from './components/header/ProjectHeader';
import DetailsPanel from './components/details/DetailsPanel';
import AiPanel from './components/chat/AiPanel';
import PipelineDrawer from './components/drawer/PipelineDrawer';
import HistorySidebar from './components/sidebar/HistorySidebar';
import useStore from './store/useStore';
import './App.css';

export default function App() {
  const autoLogin = useStore((s) => s.autoLogin);
  const isAuthenticating = useStore((s) => s.isAuthenticating);
  const currentTab = useStore((s) => s.currentTab);
  const canvasViewMode = useStore((s) => s.canvasViewMode);

  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  if (isAuthenticating) {
    return (
      <div className="auth-loading-screen">
        <div className="loading-capsule">
          <span className="loading-dot-pulse" />
          <span>Authenticating Developer Mode...</span>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="app-shell">
        <HistorySidebar />
        
        <div className="app-main-workspace">
          {/* Top Header Selector & Exporters */}
          <ProjectHeader />

          {/* Tab-driven main area */}
          <div className="app-main-content">
            {currentTab === 'chat' ? (
              <AiPanel />
            ) : (
              <>
                <AgentCanvas />
              </>
            )}
          </div>
        </div>


        {/* Slide-out details panel if needed */}
        <DetailsPanel />
      </div>
    </ReactFlowProvider>
  );
}
