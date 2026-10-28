import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { fetchApplications, fetchNotifications } from '../lib/api';
import type { Application, InPortalNotification } from '../types/database.types';
import { getStatusBadgeClass, getStatusDisplayName } from '../features/applications/workflow';
import { COORDINATOR, INSTITUTION } from '../config/constants';
import {
  PlusCircle,
  FileText,
  AlertTriangle,
  Eye,
  Layers,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Search,
  FileEdit,
  ShieldAlert,
  Bell
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<InPortalNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'action_needed' | 'review' | 'draft' | 'approved'>('all');

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [apps, notifs] = await Promise.all([
          fetchApplications(currentUser),
          fetchNotifications(currentUser.id),
        ]);
        setApplications(apps);
        setNotifications(notifs);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  // Derived metrics
  const totalCount = applications.length;
  const draftCount = applications.filter((a) => a.status === 'draft').length;
  const inReviewCount = applications.filter((a) => ['submitted', 'under_review', 'resubmitted'].includes(a.status)).length;
  const actionRequiredApps = applications.filter((a) => a.status === 'corrections_required');
  const approvedCount = applications.filter((a) => a.status === 'approved_next_stage').length;

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (filterTab === 'action_needed' && app.status !== 'corrections_required') return false;
    if (filterTab === 'review' && !['submitted', 'under_review', 'resubmitted'].includes(app.status)) return false;
    if (filterTab === 'draft' && app.status !== 'draft') return false;
    if (filterTab === 'approved' && app.status !== 'approved_next_stage') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = app.reference_number?.toLowerCase().includes(q);
      const matchTitle = app.title?.toLowerCase().includes(q);
      const matchField = app.technical_field?.toLowerCase().includes(q);
      return matchRef || matchTitle || matchField;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your patent disclosures and examination telemetry...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '28px 0 48px' }}>
      {/* Header & New Application Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Applicant Workspace
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentUser?.department || INSTITUTION.DEPARTMENTS.CSE}
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Welcome, {currentUser?.full_name}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage your invention disclosures, resolve coordinator feedback, and monitor patent examination progress.
          </p>
        </div>

        <Link
          to="/applications/new"
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          }}
        >
          <PlusCircle size={18} />
          Draft New Patent Disclosure
        </Link>
      </div>

      {/* In-Portal Notification Banner */}
      {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
        <div className="alert alert-info" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.85rem' }}>
            <strong>Recent Update:</strong> {notifications.find((n) => !n.is_read)?.message}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Critical Action Required Banner */}
      {actionRequiredApps.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #ef4444',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '6px' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                Action Required: Revisions Requested on {actionRequiredApps.length} Disclosure{actionRequiredApps.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#b91c1c', marginTop: '2px' }}>
                Patent Coordinator <strong>{COORDINATOR.FULL_NAME}</strong> has reviewed your filing and provided itemized feedback. Please review and resubmit to continue examination.
              </div>
            </div>
          </div>
          <Link
            to={`/applications/${actionRequiredApps[0].id}/corrections`}
            className="btn btn-danger btn-sm"
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Resolve Remarks Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Overview Telemetry KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Disclosures
            </span>
            <FileText size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Recorded in university registry
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Under Examination
            </span>
            <Hourglass size={18} color="#0d9488" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f766e', marginTop: '8px' }}>
            {inReviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Under active coordinator review
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: actionRequiredApps.length > 0 ? '#fff1f2' : 'var(--bg-surface)',
            border: actionRequiredApps.length > 0 ? '1px solid #fecdd3' : '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: actionRequiredApps.length > 0 ? '#e11d48' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              Action Required
            </span>
            <AlertTriangle size={18} color={actionRequiredApps.length > 0 ? '#e11d48' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: actionRequiredApps.length > 0 ? '#be123c' : 'var(--text-primary)', marginTop: '8px' }}>
            {actionRequiredApps.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: actionRequiredApps.length > 0 ? '#9f1239' : 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting student resolution
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Approved for Filing
            </span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '8px' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Forwarded for patent drafting
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', fontSize: '0.78125rem' }}
          >
            All Disclosures ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('action_needed')}
            className={`btn btn-sm ${filterTab === 'action_needed' ? 'btn-danger' : 'btn-outline'}`}
            style={{ borderRadius: '20px', fontSize: '0.78125rem' }}
          >
            Action Needed ({actionRequiredApps.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('review')}
            className={`btn btn-sm ${filterTab === 'review' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', fontSize: '0.78125rem' }}
          >
            In Examination ({inReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('draft')}
            className={`btn btn-sm ${filterTab === 'draft' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', fontSize: '0.78125rem' }}
          >
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            className={`btn btn-sm ${filterTab === 'approved' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', fontSize: '0.78125rem' }}
          >
            Approved ({approvedCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={15} />
          </span>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '36px' }}
            placeholder="Search by title, reference, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Disclosures Table Card */}
      <div className="card" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="card-title" style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>
            Invention Disclosures Registry
          </h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {filteredApps.length} of {applications.length} applications
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredApps.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h3 className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {searchQuery || filterTab !== 'all' ? 'No Matching Disclosures Found' : 'No Patent Applications Drafted Yet'}
              </h3>
              <p className="empty-state-description" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                {searchQuery || filterTab !== 'all'
                  ? 'Try adjusting your search keywords or filter tab to find your application.'
                  : 'Start your intellectual property journey by filing an invention disclosure through the E-Cell MUJ patent wizard.'}
              </p>
              {!searchQuery && filterTab === 'all' && (
                <Link to="/applications/new" className="btn btn-primary">
                  <PlusCircle size={16} />
                  Draft First Invention Disclosure
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Reference
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Invention Title &amp; Field
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Version
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Last Activity
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => {
                    const isCorrection = app.status === 'corrections_required';
                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          backgroundColor: isCorrection ? '#fff1f2' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              color: '#1e293b',
                              backgroundColor: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {app.reference_number}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', maxWidth: '340px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.3 }}>
                            {app.title || 'Untitled Invention Draft'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {app.technical_field || 'Technical field unassigned'}
                          </div>
                          {isCorrection && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                marginTop: '4px',
                                fontWeight: 600,
                              }}
                            >
                              <AlertTriangle size={12} />
                              Specific corrections requested by {COORDINATOR.FULL_NAME}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span className={getStatusBadgeClass(app.status)}>
                            {getStatusDisplayName(app.status)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78125rem',
                              fontWeight: 600,
                              color: '#334155',
                              backgroundColor: '#e2e8f0',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            <Layers size={12} />
                            V{app.current_version}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={13} />
                            {new Date(app.updated_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            {app.status === 'draft' ? (
                              <Link
                                to={`/applications/${app.id}/edit`}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                              >
                                <FileEdit size={13} />
                                Continue Draft
                              </Link>
                            ) : isCorrection ? (
                              <Link
                                to={`/applications/${app.id}/corrections`}
                                className="btn btn-danger btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                              >
                                <AlertTriangle size={13} />
                                Address Remarks
                              </Link>
                            ) : (
                              <Link
                                to={`/applications/${app.id}`}
                                className="btn btn-outline btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={13} />
                                View Details
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
