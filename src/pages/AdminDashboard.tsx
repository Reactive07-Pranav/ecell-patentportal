import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { fetchApplications } from '../lib/api';
import type { Application } from '../types/database.types';
import { getStatusBadgeClass, getStatusDisplayName } from '../features/applications/workflow';
import { 
  Eye, 
  Inbox, 
  Clock, 
  AlertCircle, 
  Search, 
  Layers,
  CheckCircle2,
  Hourglass,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { COORDINATOR, INSTITUTION } from '../config/constants';
import { PortalHero } from '../components/PortalHero';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'submitted' | 'waiting'>('waiting');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const apps = await fetchApplications(currentUser);
        setApplications(apps);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to load administrative applications'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminData();
  }, [currentUser]);

  // Exclude unsubmitted drafts from coordinator queue
  const submittedApps = applications.filter((app) => app.status !== 'draft');

  // Metrics
  const pendingScreeningCount = submittedApps.filter((a) => a.status === 'submitted').length;
  const underReviewCount = submittedApps.filter((a) => a.status === 'under_review').length;
  const correctionsDispatchedCount = submittedApps.filter((a) => a.status === 'corrections_required').length;
  const resubmittedCount = submittedApps.filter((a) => a.status === 'resubmitted').length;
  const approvedCount = submittedApps.filter((a) => a.status === 'approved_next_stage').length;

  // Calculate waiting days since last update / submission
  const getWaitingDays = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Distinct departments for filter
  const departments = Array.from(
    new Set(
      submittedApps
        .map((a) => a.profiles?.department)
        .filter((d): d is string => Boolean(d))
    )
  );

  // Filtering and searching logic
  const filteredApplications = submittedApps
    .filter((app) => {
      // Status filter
      if (statusFilter === 'needs_action' && !['submitted', 'resubmitted'].includes(app.status)) return false;
      if (statusFilter !== 'all' && statusFilter !== 'needs_action' && app.status !== statusFilter) return false;

      // Department filter
      if (deptFilter !== 'all' && app.profiles?.department !== deptFilter) return false;

      // Search query (reference number, title, or applicant name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = app.reference_number?.toLowerCase().includes(query);
        const matchesTitle = app.title?.toLowerCase().includes(query);
        const matchesOwner = app.profiles?.full_name?.toLowerCase().includes(query);
        const matchesEmail = app.profiles?.university_email?.toLowerCase().includes(query);
        const matchesDept = app.profiles?.department?.toLowerCase().includes(query);
        return matchesRef || matchesTitle || matchesOwner || matchesEmail || matchesDept;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'waiting') {
        const waitA = getWaitingDays(a.status === 'submitted' ? a.submitted_at : a.updated_at);
        const waitB = getWaitingDays(b.status === 'submitted' ? b.submitted_at : b.updated_at);
        return waitB - waitA;
      }
      if (sortBy === 'submitted') {
        const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return timeB - timeA;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading {COORDINATOR.FULL_NAME} patent screening registry...</p>
      </div>
  );
  }

  return (
    <div className="container" style={{ padding: '0 0 48px' }}>
      <PortalHero heading={`Welcome ${currentUser?.full_name} to the MUJ Patent Portal`} subtitle="Administrator Console" className="portal-hero--bleed" />
      {/* Coordinator Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              color: '#0f766e',
              border: '1px solid rgba(13, 148, 136, 0.25)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Coordinator Examination Docket
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {INSTITUTION.DEPARTMENTS.IPR_CELL} • {COORDINATOR.FULL_NAME}
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Patent Screening &amp; Examination Registry
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Review statutory disclosures, issue itemized correction notices, evaluate prior public disclosures, and authorize internal patent drafting.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertCircle size={18} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* KPI Overview Metric Cards */}
      <div
        className="admin-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: pendingScreeningCount > 0 ? '#eff6ff' : 'var(--bg-surface)',
            border: pendingScreeningCount > 0 ? '1px solid #bfdbfe' : '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: pendingScreeningCount > 0 ? '#1d4ed8' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending Screening
            </span>
            <FileText size={18} color={pendingScreeningCount > 0 ? '#2563eb' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: pendingScreeningCount > 0 ? '#1e40af' : 'var(--text-primary)', marginTop: '8px' }}>
            {pendingScreeningCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: pendingScreeningCount > 0 ? '#1e40af' : 'var(--text-muted)', marginTop: '4px' }}>
            Fresh submissions awaiting review
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
            {underReviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active coordinator docket
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px 20px',
            backgroundColor: resubmittedCount > 0 ? '#f0fdf4' : 'var(--bg-surface)',
            border: resubmittedCount > 0 ? '1px solid #bbf7d0' : '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: resubmittedCount > 0 ? '#15803d' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              Resubmitted (V2+)
            </span>
            <Layers size={18} color={resubmittedCount > 0 ? '#16a34a' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: resubmittedCount > 0 ? '#166534' : 'var(--text-primary)', marginTop: '8px' }}>
            {resubmittedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: resubmittedCount > 0 ? '#166534' : 'var(--text-muted)', marginTop: '4px' }}>
            Corrections addressed by student
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Corrections Dispatched
            </span>
            <AlertTriangle size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '8px' }}>
            {correctionsDispatchedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Awaiting applicant response
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Approved Disclosures
            </span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '8px' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cleared for drafting
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card admin-filter-bar" style={{ marginBottom: '20px', borderRadius: '8px' }}>
          <div className="admin-filter-controls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '0.8125rem' }}
                placeholder="Search reference, applicant name, title, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                style={{ fontSize: '0.8125rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Registry Items ({submittedApps.length})</option>
                <option value="needs_action">⚠️ Urgent: Needs Coordinator Action ({pendingScreeningCount + resubmittedCount})</option>
                <option value="submitted">Submitted (Fresh)</option>
                <option value="under_review">Under Review</option>
                <option value="resubmitted">Resubmitted with Corrections</option>
                <option value="corrections_required">Corrections Dispatched</option>
                <option value="approved_next_stage">Approved for Next Stage</option>
              </select>
            </div>

            {/* Department Filter */}
            {departments.length > 0 && (
              <div style={{ minWidth: '160px' }}>
                <select
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                style={{ fontSize: '0.8125rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="waiting">Sort: Longest Waiting</option>
                <option value="updated">Sort: Recently Updated</option>
                <option value="submitted">Sort: Initial Submission</option>
              </select>
             </div>
           </div>
       </div>
 
       {/* Registry Table */}
      <div className="card admin-table-wrap" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface)' }}>
          <h2 className="card-title" style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>
            Examination Docket
          </h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {filteredApplications.length} of {submittedApps.length} active applications
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredApplications.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Inbox size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h3 className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                No Applications Match Your Filters
              </h3>
              <p className="empty-state-description" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {searchQuery || statusFilter !== 'all' || deptFilter !== 'all'
                  ? 'Try clearing or relaxing your search criteria to see more applications.'
                  : 'There are currently no invention disclosures submitted in the queue.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 900 }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Reference &amp; SLA
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Invention Title &amp; Field
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Applicant &amp; Department
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Version
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const daysWaiting = getWaitingDays(app.status === 'submitted' ? app.submitted_at : app.updated_at);
                    const isUrgent = daysWaiting >= 5 && ['submitted', 'resubmitted'].includes(app.status);

                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          backgroundColor: isUrgent ? '#fffbeb' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                color: '#1e293b',
                                backgroundColor: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                width: 'fit-content',
                              }}
                            >
                              {app.reference_number}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: daysWaiting > 5 ? '#b45309' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={11} />
                              {daysWaiting === 0 ? 'Today' : `${daysWaiting}d waiting`}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', maxWidth: '320px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={app.title}>
                            {app.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.technical_field}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                            {app.profiles?.full_name || 'Applicant'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {app.profiles?.department || 'Department unassigned'}
                          </div>
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

                        <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <Link
                            to={`/admin/applications/${app.id}`}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600,
                              borderColor: '#0f766e',
                              color: '#0f766e',
                            }}
                          >
                            <Eye size={13} />
                            <span>Examine Dossier</span>
                          </Link>
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

export default AdminDashboard;
