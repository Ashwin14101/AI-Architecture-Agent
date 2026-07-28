// Shows KPIs above the canvas: component count, total cost, security issues, quality score
import React from 'react';
import useStore from '../../store/useStore';
import { Network, DollarSign, Shield, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import './ArchitectureSummaryBar.css';

export default function ArchitectureSummaryBar() {
  const generatedData = useStore(s => s.generatedData);
  const qualityScore = useStore(s => s.qualityScore);
  const pipelineStatus = useStore(s => s.pipelineStatus);
  const costData = useStore(s => s.costData); // { total_monthly_usd, per_component }
  const securityFindings = useStore(s => s.securityFindings); // array of findings
  
  if (!generatedData && pipelineStatus !== 'complete') return null;
  
  const componentCount = (generatedData?.components || []).length;
  const apiCount = (generatedData?.apis || []).length;
  const tableCount = (generatedData?.database_schema || []).length;
  const totalCost = costData?.total_monthly_usd ?? generatedData?.costs?.total_estimated_monthly_cost ?? null;
  const criticalFindings = (securityFindings || []).filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL').length;
  const warnFindings = (securityFindings || []).filter(f => f.severity === 'MEDIUM').length;
  const score = qualityScore || null;
  
  return (
    <div className="arch-summary-bar">
      <div className="asb-stat">
        <div className="asb-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
          <Network size={14} />
        </div>
        <div className="asb-content">
          <span className="asb-value">{componentCount}</span>
          <span className="asb-label">Components</span>
        </div>
      </div>
      
      <div className="asb-divider" />
      
      <div className="asb-stat">
        <div className="asb-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
          <Network size={14} />
        </div>
        <div className="asb-content">
          <span className="asb-value">{apiCount}</span>
          <span className="asb-label">API Routes</span>
        </div>
      </div>
      
      <div className="asb-divider" />
      
      <div className="asb-stat">
        <div className="asb-icon" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
          <Network size={14} />
        </div>
        <div className="asb-content">
          <span className="asb-value">{tableCount}</span>
          <span className="asb-label">DB Tables</span>
        </div>
      </div>
      
      {totalCost !== null && (
        <>
          <div className="asb-divider" />
          <div className="asb-stat">
            <div className="asb-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <DollarSign size={14} />
            </div>
            <div className="asb-content">
              <span className="asb-value">${totalCost.toFixed(2)}</span>
              <span className="asb-label">Est. /month</span>
            </div>
          </div>
        </>
      )}
      
      {(criticalFindings > 0 || warnFindings > 0) && (
        <>
          <div className="asb-divider" />
          <div className="asb-stat">
            <div className="asb-icon" style={{ background: criticalFindings > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: criticalFindings > 0 ? '#ef4444' : '#f59e0b' }}>
              <AlertTriangle size={14} />
            </div>
            <div className="asb-content">
              <span className="asb-value" style={{ color: criticalFindings > 0 ? '#ef4444' : '#f59e0b' }}>
                {criticalFindings > 0 ? `${criticalFindings} Critical` : `${warnFindings} Warnings`}
              </span>
              <span className="asb-label">Security</span>
            </div>
          </div>
        </>
      )}
      
      {score !== null && (
        <>
          <div className="asb-divider" />
          <div className="asb-stat">
            <div className="asb-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
              <Star size={14} />
            </div>
            <div className="asb-content">
              <span className="asb-value" style={{ color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>{score}/100</span>
              <span className="asb-label">Quality Score</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
