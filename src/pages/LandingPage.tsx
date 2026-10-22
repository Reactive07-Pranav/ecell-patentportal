import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  ShieldCheck,
  FileText,
  Lock,
  History,
  ArrowRight,
  AlertCircle,
  Search,
  BookOpen,
  Award,
} from 'lucide-react';
import { INSTITUTION, COORDINATOR } from '../config/constants';
import { fetchApplicationById } from '../lib/api';
import { GuidelinesModal } from '../components/GuidelinesModal';

export const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [refSearch, setRefSearch] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleTrackApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refSearch.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // If user is not logged in, prompt sign-in
      if (!currentUser) {
        navigate('/auth/login', { state: { trackingRef: refSearch.trim() } });
        return;
      }

      // Try locating by reference number or ID
      const app = await fetchApplicationById(refSearch.trim(), currentUser);
      if (app) {
        navigate(`/applications/${app.id}`);
      } else {
        setSearchError('Application not found or access restricted to authorized inventors.');
      }
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Unable to retrieve application status.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px' }}>
      {/* Institutional Pre-Screening Notice */}
      <div className="alert alert-info" style={{ marginBottom: '28px', backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#0284c7' }} />
        <div style={{ fontSize: '0.8125rem', color: '#0369a1', lineHeight: 1.5 }}>
          <strong>Official Institutional Screening Notice:</strong> This portal facilitates internal university pre-screening and coordinator novelty review by the {INSTITUTION.DEPARTMENTS.IPR_CELL}. Directorate approval qualifies approved inventions for sponsored statutory filing and drafting before the Indian Patent Office (IPO).
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="card"
        style={{
          padding: '48px 40px',
          marginBottom: '36px',
          boxShadow: '0 4px 24px rgba(10, 25, 47, 0.05)',
          border: '1px solid var(--border-light)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              backgroundColor: '#e0f2fe',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#0369a1',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <ShieldCheck size={14} />
            {INSTITUTION.NAME} &bull; {INSTITUTION.DEPARTMENTS.IPR_CELL}
          </div>

          <h1
            style={{
              fontSize: '2.125rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}
          >
            Patent Application &amp; Invention Disclosure Portal
          </h1>

          <p
            style={{
              fontSize: '1.0625rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 28px',
            }}
          >
            A centralized digital gateway for {INSTITUTION.SHORT_NAME} students and faculty to submit intellectual property disclosures, track examination milestones, and resolve itemized review comments with Patent Coordinator <strong>{COORDINATOR.FULL_NAME}</strong>.
          </p>

          {/* Primary CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {currentUser ? (
              currentUser.role === 'super_admin' ? (
                <Link to="/superadmin/dashboard" className="btn btn-primary btn-lg" style={{ padding: '12px 24px', backgroundColor: '#7e22ce', borderColor: '#7e22ce' }}>
                  <ShieldCheck size={18} />
                  Open Portal Supervision Console
                  <ArrowRight size={16} />
                </Link>
              ) : currentUser.role === 'admin' ? (
                <Link to="/admin/dashboard" className="btn btn-primary btn-lg" style={{ padding: '12px 24px' }}>
                  <ShieldCheck size={18} />
                  Open Coordinator Screening Registry
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/workspace" className="btn btn-primary btn-lg" style={{ padding: '12px 24px' }}>
                    <FileText size={18} />
                    Open Patent Workspace
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline btn-lg" style={{ padding: '12px 20px' }}>
                    View My Applications ({currentUser.full_name})
                  </Link>
                </>
              )
            ) : (
              <>
                <Link to="/auth/login" className="btn btn-primary btn-lg" style={{ padding: '12px 24px' }}>
                  Sign In with University ID
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              className="btn btn-outline btn-lg"
              style={{ padding: '12px 18px', color: '#64748b' }}
            >
              <BookOpen size={16} />
              IPR Guidelines
            </button>
          </div>
        </div>
      </div>

      {/* 4-Stage University Patenting Workflow */}
      <div style={{ marginBottom: '44px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Statutory Examination &amp; Disclosure Workflow
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Eliminating fragmented email chains with transparent, version-controlled patent drafting:
          </p>
        </div>

        <div className="grid-2" style={{ gap: '16px' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '24px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                  marginBottom: '14px',
                }}
              >
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 6px' }}>1. Structured Technical Disclosure</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Submit comprehensive disclosures including technical domain, problem statement, working mechanism, novel inventive step, and inventor percentage shares with automated 100% share balance validation.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '24px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                  marginBottom: '14px',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 6px' }}>2. Novelty Screening (Dr. Dorelal Sharma)</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Preliminary novelty screening under Section 2(1)(j) and Section 3 of the Indian Patents Act 1970. The coordinator assesses patentability, prior-art differentiation, and institutional eligibility.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '24px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#fff7ed',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c',
                  marginBottom: '14px',
                }}
              >
                <History size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 6px' }}>3. Itemized Correction &amp; Version N+1</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                If claims or drawings require refinement, the coordinator issues itemized remarks. Applicants resolve remarks in a split-screen workspace, preserving complete audit trails across revisions.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '24px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#faf5ff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9333ea',
                  marginBottom: '14px',
                }}
              >
                <Award size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '0 0 6px' }}>4. Directorate Approval &amp; Filing Cell</h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Approved applications are formally signed off via coordinator MFA step-up and routed to the university patent attorneys for statutory drafting and filing with the Controller General of Patents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security, Confidentiality & Quick Tracker */}
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Quick Reference Tracker */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '0.9375rem', margin: 0 }}>Application Status Search</h3>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '14px' }}>
              Enter your official disclosure reference number (e.g. <code>{INSTITUTION.SHORT_NAME}-PAT-2026-0001</code>) to inspect review status:
            </p>

            <form onSubmit={handleTrackApplication} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder={`${INSTITUTION.SHORT_NAME}-PAT-YYYY-XXXX`}
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Track'}
              </button>
            </form>

            {searchError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '8px' }}>
                {searchError}
              </div>
            )}
          </div>
        </div>

        {/* Confidentiality & Security Guarantee */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '0.9375rem', margin: 0 }}>Data Isolation &amp; Confidentiality</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Invention disclosures, prior-art documents, and engineering schematics are stored in isolated private storage. Strict database Row-Level Security (RLS) ensures that student disclosures are inaccessible to other students, while administrative oversight is strictly reserved for Patent Coordinator <strong>{COORDINATOR.FULL_NAME}</strong>.
            </p>
          </div>
        </div>
      </div>

      <GuidelinesModal isOpen={isGuidelinesOpen} onClose={() => setIsGuidelinesOpen(false)} />
    </div>
  );
};
