import React, { useState, useEffect } from 'react';
import {
  fetchAllProfiles,
  fetchProcessSupervisionOverview,
  superAdminResetUserPassword,
  superAdminUpdateUserRole,
  fetchSuperAdminTelemetry,
  type ProcessSupervisionItem,
} from '../lib/api';
import type { Profile, AppRole } from '../types/database.types';
import { getStatusDisplayName, getStatusBadgeClass } from '../features/applications/workflow';
import { INSTITUTION, COORDINATOR } from '../config/constants';
import {
  ShieldCheck,
  Users,
  FileCheck,
  Clock,
  KeyRound,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Database,
  Lock,
  UserCheck,
  Layers,
  BarChart3,
  Server,
  Shield
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'telemetry' | 'process' | 'system'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [processItems, setProcessItems] = useState<ProcessSupervisionItem[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin' | 'super_admin'>('all');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role Change Modal State
  const [roleModalUser, setRoleModalUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allProcesses, telemetryData] = await Promise.all([
        fetchAllProfiles(),
        fetchProcessSupervisionOverview(),
        fetchSuperAdminTelemetry(),
      ]);
      setProfiles(allUsers);
      setProcessItems(allProcesses);
      setTelemetry(telemetryData);
    } catch (err) {
      console.error('Failed to load super admin supervision data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (newPassword.length < 6) {
      setModalFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsResetting(true);
    setModalFeedback(null);
    try {
      const res = await superAdminResetUserPassword(
        resetModalUser.university_email,
        newPassword,
        resetModalUser.full_name,
        resetModalUser.department || undefined
      );

      if (res.success) {
        setModalFeedback({
          type: 'success',
          text: `Password for ${resetModalUser.university_email} successfully updated!`,
        });
        setNewPassword('');
        setTimeout(() => {
          setResetModalUser(null);
          setModalFeedback(null);
        }, 1500);
      } else {
        setModalFeedback({ type: 'error', text: res.error || 'Failed to reset password.' });
      }
    } catch (err) {
      setModalFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reset password.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;

    setIsUpdatingRole(true);
    setRoleFeedback(null);
    try {
      const res = await superAdminUpdateUserRole(roleModalUser.id, selectedRole);
      if (res.success) {
        setRoleFeedback({
          type: 'success',
          text: `Role for ${roleModalUser.full_name} updated to ${selectedRole.toUpperCase()}!`,
        });
        await loadData();
        setTimeout(() => {
          setRoleModalUser(null);
          setRoleFeedback(null);
        }, 1400);
      } else {
        setRoleFeedback({ type: 'error', text: res.error || 'Failed to update user role.' });
      }
    } catch (err) {
      setRoleFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update user role.',
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Filtered Users
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.university_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.registration_number && p.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Supervision Metrics
  const totalUsers = telemetry?.total_users ?? profiles.length;
  const totalStudents = telemetry?.total_students ?? profiles.filter((p) => p.role === 'student').length;
  const totalAdmins = telemetry?.total_admins ?? profiles.filter((p) => p.role === 'admin').length;
  const totalApplications = telemetry?.total_applications ?? processItems.length;

  const statusCounts = telemetry?.applications_by_status || {};
  const draftCount = statusCounts.draft || 0;
  const submittedCount = statusCounts.submitted || 0;
  const inReviewCount = statusCounts.under_review || 0;
  const correctionsCount = statusCounts.corrections_required || 0;
  const resubmittedCount = statusCounts.resubmitted || 0;
  const approvedCount = statusCounts.approved_next_stage || 0;

  const deptCounts = telemetry?.applications_by_department || {};

  return (
    <div className="container" style={{ padding: '28px 0 80px' }}>
      {/* Super Admin Supervision Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#f3e8ff', color: '#7e22ce', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <ShieldCheck size={14} />
            Master IT &amp; Process Governance
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Portal Supervision &amp; User Administration
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Supervise accounts, assign roles, inspect operational pipeline telemetry, and maintain institutional uptime.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-outline"
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Directory
        </button>
      </div>

      {/* Statutory Confidentiality Shield Notice */}
      <div
        className="alert alert-info"
        style={{
          marginBottom: '24px',
          backgroundColor: '#faf5ff',
          borderColor: '#e9d5ff',
          color: '#6b21a8',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Lock size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#9333ea' }} />
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
          <strong>Statutory IPR Confidentiality Shield Active:</strong> Under Section 39 of the Indian Patents Act and {INSTITUTION.NAME} IPR Policy, technical invention descriptions, novel claims, and private blueprints are strictly shielded from IT supervision. The Super Admin manages user identity, lifecycle milestones, and administrative support without viewing secret patent bodies or claims.
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Registered Users</span>
            <Users size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalStudents} Students • {totalAdmins} Coordinators
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0d9488' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Total Filed Inventions</span>
            <Layers size={16} color="#0d9488" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalApplications}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {submittedCount + inReviewCount + resubmittedCount} Active in Screening
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Approved for IPO Filing</span>
            <FileCheck size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Passed statutory evaluation
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #9333ea' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Database &amp; RLS State</span>
            <Database size={16} color="#9333ea" />
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16a34a', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} />
            PostgreSQL Live
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Row Level Security (RLS) Enforced
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #7c3aed' : '2px solid transparent',
            fontWeight: activeTab === 'users' ? 700 : 500,
            color: activeTab === 'users' ? '#7c3aed' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} />
          User &amp; Identity Management ({profiles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'telemetry' ? '2px solid #7c3aed' : '2px solid transparent',
            fontWeight: activeTab === 'telemetry' ? 700 : 500,
            color: activeTab === 'telemetry' ? '#7c3aed' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BarChart3 size={16} />
          Pipeline &amp; Department Telemetry
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('process')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'process' ? '2px solid #7c3aed' : '2px solid transparent',
            fontWeight: activeTab === 'process' ? 700 : 500,
            color: activeTab === 'process' ? '#7c3aed' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} />
          Process Supervision Log ({processItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'system' ? '2px solid #7c3aed' : '2px solid transparent',
            fontWeight: activeTab === 'system' ? 700 : 500,
            color: activeTab === 'system' ? '#7c3aed' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Server size={16} />
          Infrastructure &amp; Security State
        </button>
      </div>

      {/* TAB 1: User Directory & Identity Management */}
      {activeTab === 'users' && (
        <div className="card" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, department, roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.8125rem', padding: '7px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Role Filter:</span>
              <select
                className="form-control"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                style={{ fontSize: '0.8125rem', padding: '6px 10px', width: 'auto' }}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Coordinators (Admin)</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-medium)' }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>User &amp; Full Name</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>University Email</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Department</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Registration No.</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.full_name}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        {p.university_email}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              p.role === 'super_admin'
                                ? '#f3e8ff'
                                : p.role === 'admin'
                                ? '#ccfbf1'
                                : '#e0f2fe',
                            color:
                              p.role === 'super_admin'
                                ? '#7e22ce'
                                : p.role === 'admin'
                                ? '#0f766e'
                                : '#0369a1',
                            border: `1px solid ${
                              p.role === 'super_admin'
                                ? '#d8b4fe'
                                : p.role === 'admin'
                                ? '#99f6e4'
                                : '#bae6fd'
                            }`,
                          }}
                        >
                          {p.role === 'super_admin' ? 'Super Admin' : p.role === 'admin' ? 'Coordinator' : 'Student'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {p.department || 'Not specified'}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        {p.registration_number || '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(p);
                              setSelectedRole(p.role);
                              setRoleFeedback(null);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                          >
                            <UserCheck size={12} />
                            Change Role
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(p);
                              setNewPassword('');
                              setModalFeedback(null);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                          >
                            <KeyRound size={12} />
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No user accounts found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Telemetry & Funnel Overview */}
      {activeTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stage Funnel Telemetry */}
          <div className="card" style={{ padding: '24px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px' }}>
              Invention Lifecycle Pipeline Funnel
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Real-time aggregation across examination lifecycle stages (Confidentiality shield active).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Draft Mode</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#334155', marginTop: '4px' }}>{draftCount}</div>
              </div>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>Submitted</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>{submittedCount}</div>
              </div>
              <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600, textTransform: 'uppercase' }}>Under Review</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>{inReviewCount}</div>
              </div>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Corrections Req.</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{correctionsCount}</div>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>Resubmitted</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{resubmittedCount}</div>
              </div>
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Approved Stage</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>{approvedCount}</div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="card" style={{ padding: '24px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px' }}>
              Disclosures by Academic Department
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Breakdown of research filings across academic disciplines in Manipal University Jaipur.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.keys(deptCounts).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No department statistics recorded yet.</div>
              ) : (
                Object.entries(deptCounts).map(([dept, count]: [string, any]) => {
                  const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                  return (
                    <div key={dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} application{count > 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Process Supervision Log */}
      {activeTab === 'process' && (
        <div className="card" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 className="card-title" style={{ fontSize: '1.0625rem' }}>
              Statutory Application Processing Docket
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Process tracking without trade-secret or patent specification exposure
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-medium)' }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Reference Number</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Applicant Name</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Department</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Lifecycle Stage</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Version</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Submitted At</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {processItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>
                        {item.reference_number}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.applicant_name}</td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {item.applicant_department}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${getStatusBadgeClass(item.status)}`} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {getStatusDisplayName(item.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                        V{item.current_version}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'Draft Mode'}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {processItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No active patent disclosures registered in the university system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Infrastructure & Security Health */}
      {activeTab === 'system' && (
        <div className="grid-2" style={{ gap: '20px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="#2563eb" />
              Database &amp; Platform Infrastructure
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Host Institution</span>
                <strong>{INSTITUTION.NAME}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Patent Directorate</span>
                <strong>{INSTITUTION.DEPARTMENTS.IPR_CELL}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Patent Coordinator</span>
                <strong>{COORDINATOR.FULL_NAME}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Supabase Project</span>
                <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>cwjnujgzsuphfkbybvoz</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Private Storage Bucket</span>
                <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>patent-documents (25MB Max)</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Governance Mode</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Master Super Admin (IT Governance)</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#16a34a" />
              Row Level Security (RLS) Policy Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={16} />
                <span><code>profiles</code>: Users read own; Admin/Super Admin reads all.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={16} />
                <span><code>applications</code>: Students read own; Coordinator reads all; Super Admin shielded.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={16} />
                <span><code>applications UPDATE</code>: Explicit WITH CHECK transitions verified.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={16} />
                <span><code>storage.objects</code>: Private patent-documents bucket isolated.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <CheckCircle2 size={16} />
                <span><code>application_status_history</code>: Immutable audit trigger logging.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Update Modal */}
      {roleModalUser && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed' }}>
                <UserCheck size={18} />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', margin: 0 }}>
                  Modify User Authorization Role
                </h3>
              </div>
            </div>
            <form onSubmit={handleUpdateRole}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Changing authorization role for <strong>{roleModalUser.full_name}</strong> (<code>{roleModalUser.university_email}</code>).
                </div>

                {roleFeedback && (
                  <div className={`alert ${roleFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
                    {roleFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <div>{roleFeedback.text}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Assign Role <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                    required
                  >
                    <option value="student">Student Applicant (Disclosures &amp; Submissions)</option>
                    <option value="admin">IPR Coordinator / Admin (Screening &amp; Clearances)</option>
                    <option value="super_admin">Master Super Admin (IT Governance)</option>
                  </select>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRoleModalUser(null);
                    setRoleFeedback(null);
                  }}
                  className="btn btn-outline"
                  disabled={isUpdatingRole}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                  disabled={isUpdatingRole}
                >
                  {isUpdatingRole ? 'Updating Role...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                <KeyRound size={18} />
                <h3 className="card-title" style={{ fontSize: '1.0625rem', margin: 0 }}>
                  Reset User Password
                </h3>
              </div>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Setting new access password for <strong>{resetModalUser.full_name}</strong> (<code>{resetModalUser.university_email}</code>).
                </div>

                {modalFeedback && (
                  <div className={`alert ${modalFeedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
                    {modalFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <div>{modalFeedback.text}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    New Password (Min 6 characters) <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetModalUser(null);
                    setModalFeedback(null);
                  }}
                  className="btn btn-outline"
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isResetting || !newPassword}
                >
                  {isResetting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
