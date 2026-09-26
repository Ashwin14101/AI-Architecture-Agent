import React, { useState } from 'react';
import { Plus, History, Folder, Search, CheckCircle2, ChevronRight, MessageSquare, Clock } from 'lucide-react';
import useStore from '../../store/useStore';
import './HistorySidebar.css';

export default function HistorySidebar() {
  const projects = useStore((s) => s.projects);
  const currentProject = useStore((s) => s.currentProject);
  const selectProject = useStore((s) => s.selectProject);
  const createProject = useStore((s) => s.createProject);
  const uploadedDocuments = useStore((s) => s.uploadedDocuments);

  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewProject = async () => {
    const name = prompt("Enter project name:", "New Workspace");
    if (name) {
      await createProject(name, "New workspace from sidebar");
    }
  };

  return (
    <div className="history-sidebar">
      
      <div className="history-top-actions">
        <button className="hs-new-btn" onClick={handleNewProject}>
          <Plus size={16} />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="hs-section">
        <div className="hs-section-title">
          <History size={14} />
          <span>Workspace History</span>
        </div>
        
        <div className="hs-search-box">
          <Search size={12} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hs-project-list">
          {filteredProjects.map(p => (
            <div key={p.id} className="hs-project-wrapper">
              <button 
                className={`hs-project-item ${currentProject?.id === p.id ? 'active' : ''}`}
                onClick={() => selectProject(p)}
              >
                <div className="hs-proj-icon">
                  {currentProject?.id === p.id ? <Folder size={14} color="#8b5cf6" /> : <Folder size={14} />}
                </div>
                <div className="hs-proj-name">{p.name}</div>
              </button>
              
              {/* Show documents if this is the active project */}
              {currentProject?.id === p.id && uploadedDocuments?.length > 0 && (
                <div className="hs-project-docs">
                  {uploadedDocuments.map(doc => (
                    <div key={doc.id} className="hs-doc-item" title="Double click to read (Context loaded for Chat)">
                      <div className="hs-doc-indicator" />
                      <span className="hs-doc-name">{doc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
