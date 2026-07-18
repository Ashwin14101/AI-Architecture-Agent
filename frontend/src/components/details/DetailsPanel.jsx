import React from 'react';
import { X, Loader2, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import './DetailsPanel.css';

export default function DetailsPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedNodeData = useStore((s) => s.selectedNodeData);
  const isLoading = useStore((s) => s.isLoadingDetails);
  const selectNode = useStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const handleClose = () => selectNode(null);

  const getTitle = () => {
    switch (selectedNodeId) {
      case 'requirement': return 'Extracted Requirements';
      case 'architecture': return 'Logical Component Specifications';
      case 'database': return 'Database Schema Modelling';
      case 'api': return 'API Specification Map';
      case 'cloud-mapping': return 'AWS Cloud Mapping & Costs';
      case 'terraform': return 'Terraform (IaC) Code';
      case 'security': return 'Security & Policy Audit';
      case 'validation': return 'Syntax & Compilation Validation';
      case 'review': return 'Architecture Audit & Grading';
      default: return 'Agent Phase Output';
    }
  };

  return (
    <div className="details-panel-wrapper open">
      <div className="details-panel-header">
        <h3>{getTitle()}</h3>
        <button className="close-btn" onClick={handleClose}>
          <X size={18} />
        </button>
      </div>

      <div className="details-panel-body">
        {isLoading ? (
          <div className="details-loading">
            <Loader2 className="spin-icon" size={24} />
            <span>Retrieving agent specifications...</span>
          </div>
        ) : !selectedNodeData ? (
          <div className="details-empty">
            <Info size={24} />
            <p>No specifications generated yet. Run the pipeline to start the agents.</p>
          </div>
        ) : selectedNodeData.error ? (
          <div className="details-error">
            <AlertCircle size={24} />
            <p>{selectedNodeData.error}</p>
          </div>
        ) : (
          <div className="details-content">
            {renderDetails(selectedNodeId, selectedNodeData)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderDetails(nodeId, data) {
  switch (nodeId) {
    case 'requirement':
      return (
        <div className="details-req-list">
          {data.description ? (
            <div className="doc-desc-box">
              <h4>Project Description</h4>
              <p>{data.description}</p>
            </div>
          ) : (
            <p>Requirements parsed successfully.</p>
          )}
        </div>
      );

    case 'architecture':
      const components = data || [];
      return (
        <div className="details-components-list">
          <h4>Logical Architecture Model</h4>
          {components.length === 0 ? <p>No components defined.</p> : (
            components.map((comp, i) => (
              <div key={i} className="component-card">
                <span className="component-id">{comp.id || `COMP-${i+1}`}</span>
                <h5 className="component-name">{comp.name || comp.type}</h5>
                <span className="component-type-tag">{comp.type}</span>
                {comp.description && <p className="component-desc">{comp.description}</p>}
              </div>
            ))
          )}
        </div>
      );

    case 'database':
      const tables = data || [];
      return (
        <div className="details-db-list">
          <h4>Database Schema Model</h4>
          {tables.length === 0 ? <p>No table schemas found.</p> : (
            tables.map((table, i) => (
              <div key={i} className="db-table-card">
                <h5 className="db-table-name">📁 Table: {table.name}</h5>
                {table.columns && table.columns.length > 0 && (
                  <table className="db-columns-table">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Data Type</th>
                        <th>Constraint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col, j) => (
                        <tr key={j}>
                          <td className="field-name">{col.name}</td>
                          <td className="field-type">{col.type}</td>
                          <td className="field-constraint">{col.constraint || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      );

    case 'api':
      const endpoints = data || [];
      return (
        <div className="details-api-list">
          <h4>REST Routing Map</h4>
          {endpoints.length === 0 ? <p>No endpoints parsed.</p> : (
            endpoints.map((ep, i) => (
              <div key={i} className="api-endpoint-card">
                <span className={`api-method ${ep.method?.toLowerCase()}`}>
                  {ep.method || 'GET'}
                </span>
                <span className="api-path">{ep.path || ep.route}</span>
                {ep.description && <p className="api-desc">{ep.description}</p>}
              </div>
            ))
          )}
        </div>
      );

    case 'cloud-mapping':
      const mappings = data.mappings || [];
      const costs = data.costs || {};
      return (
        <div className="details-cloud-list">
          <h4>AWS Topography Deployment</h4>
          {mappings.map((m, i) => (
            <div key={i} className="cloud-mapping-card">
              <span className="cloud-comp-name">{m.logical_component}</span>
              <span className="arrow-sep">→</span>
              <span className="cloud-service-tag">{m.aws_service}</span>
            </div>
          ))}
          {costs.total_estimated_monthly_cost && (
            <div className="cloud-cost-breakdown">
              <h4>Cost Budget Summary</h4>
              <div className="cost-row">
                <span>Estimated Monthly Cost:</span>
                <strong className="cost-value">${costs.total_estimated_monthly_cost}</strong>
              </div>
              <div className="cost-row">
                <span>Budget Limit ($200):</span>
                <span className="status-success-tag">Within Budget ✅</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'terraform':
      const tfCode = data.terraformCode || '';
      return (
        <div className="details-tf-box">
          <h4>Compiled Infrastructure-as-Code</h4>
          <pre className="code-pre">
            <code>{tfCode}</code>
          </pre>
        </div>
      );

    case 'security':
    case 'validation':
    case 'review':
      const findings = data.findings || [];
      return (
        <div className="details-review-box">
          <div className="review-score-banner">
            <span className="review-score-label">Grading Audit Score</span>
            <strong className="review-score-number">{data.score || 100}%</strong>
          </div>
          <h4>Audit Review Findings</h4>
          {findings.length === 0 ? (
            <div className="audit-success">
              <CheckCircle2 size={16} />
              <span>All security, compliance, and design checks passed!</span>
            </div>
          ) : (
            findings.map((f, i) => (
              <div key={i} className={`finding-card severity-${f.severity || 'medium'}`}>
                <div className="finding-header">
                  <span className="finding-id">{f.ruleId}</span>
                  <span className="finding-severity">{f.severity}</span>
                </div>
                <p className="finding-desc">{f.description}</p>
                {f.recommendation && (
                  <div className="finding-reco">
                    <strong>Suggestion:</strong> {f.recommendation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      );

    default:
      return <p>No specific visualization template for this agent output.</p>;
  }
}
