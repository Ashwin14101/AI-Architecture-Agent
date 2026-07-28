import React, { useState } from 'react';
import { X, Sparkles, Database, Network, Globe, DollarSign, Shield, Zap, MousePointer } from 'lucide-react';
import useStore from '../../store/useStore';
import './DetailsPanel.css';

export default function DetailsPanel() {
  const selectedNode = useStore(s => s.selectedNode);
  const setSelectedNode = useStore(s => s.setSelectedNode);
  const costData = useStore(s => s.costData);
  const securityFindings = useStore(s => s.securityFindings);
  const currentProject = useStore(s => s.currentProject);
  const addLog = useStore(s => s.addLog);
  const token = useStore(s => s.token);
  
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExplain = async () => {
    if (!selectedNode || !currentProject) return;
    setIsExplaining(true);
    setExplanation('');
    try {
      const res = await fetch(`http://localhost:3000/api/chat/${currentProject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: `Explain the architecture component: ${selectedNode.data.name || selectedNode.id}` })
      });
      if (!res.ok) throw new Error('Failed to fetch explanation');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.text) setExplanation(prev => prev + data.text);
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      addLog({ level: 'error', message: 'Failed to explain component' });
    } finally {
      setIsExplaining(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="details-panel empty">
        <div className="dp-empty-content">
          <MousePointer size={32} />
          <h3>No Component Selected</h3>
          <p>Click any node to inspect it</p>
        </div>
      </div>
    );
  }

  const { data, type } = selectedNode;
  
  const compCost = costData?.per_component?.find(c => c.component_id === selectedNode.id || c.name === data.name);
  const compSec = (securityFindings || []).filter(f => f.resource?.toLowerCase().includes(data.name?.toLowerCase().replace(/\s+/g, '_')));

  return (
    <div className="details-panel">
      <div className="dp-header">
        <h2>{data.name || 'Component'}</h2>
        <button className="dp-close" onClick={() => setSelectedNode(null)}><X size={16} /></button>
      </div>

      <div className="dp-content">
        {type === 'systemComponentNode' && (
          <div className="dp-section">
            <div className="dp-badges">
              <span className="dp-badge type">{data.type}</span>
              {compCost && <span className="dp-badge cost"><DollarSign size={12}/> ${compCost.monthly_usd}/mo</span>}
              {compSec.length > 0 && <span className="dp-badge security"><Shield size={12}/> {compSec.length} Issues</span>}
            </div>
            <p className="dp-desc">{data.description}</p>
            
            <button className="dp-explain-btn" onClick={handleExplain} disabled={isExplaining}>
              {isExplaining ? <Zap size={14} className="spin" /> : <Sparkles size={14} />} Explain ✨
            </button>
            {explanation && (
              <div className="dp-explanation">
                {explanation}
              </div>
            )}
          </div>
        )}

        {type === 'dbTableNode' && (
          <div className="dp-section">
            <div className="dp-badges">
              <span className="dp-badge type db"><Database size={12}/> Table</span>
            </div>
            <div className="dp-columns">
              <h4>Columns</h4>
              {data.columns?.map((c, i) => (
                <div key={i} className="dp-col-row">
                  <span className="dp-col-name">{c.name}</span>
                  <span className="dp-col-type">{c.type}</span>
                  {c.constraints?.includes('PRIMARY KEY') && <span className="dp-col-pk">PK</span>}
                  {c.constraints?.includes('FOREIGN KEY') && <span className="dp-col-fk">FK</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'apiEndpointNode' && (
          <div className="dp-section">
            <div className="dp-badges">
              <span className={`dp-badge method ${data.method?.toLowerCase()}`}>{data.method}</span>
            </div>
            <p className="dp-path">{data.path}</p>
            <p className="dp-desc">{data.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
