import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { fetchApplications, fetchNotifications } from "../lib/api";
import type { Application, InPortalNotification } from "../types/database.types";
import { getStatusBadgeClass, getStatusDisplayName } from "../features/applications/workflow";
import { COORDINATOR, INSTITUTION } from "../config/constants";
import { PortalHero } from "../components/PortalHero";
import {
  PlusCircle,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  Search,
  ShieldAlert,
  Bell,
  ChevronRight,
  Eye,
  FileEdit,
} from "lucide-react";

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<InPortalNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"all" | "action_needed" | "review" | "draft" | "approved">("all");

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
        setErrorMessage(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [currentUser]);

  // Derived metrics
  const totalCount = applications.length;
  const draftCount = applications.filter((a) => a.status === "draft").length;
  const inReviewCount = applications.filter((a) =>
    ["submitted", "under_review", "resubmitted"].includes(a.status)
  ).length;
  const actionRequiredApps = applications.filter((a) => a.status === "corrections_required");
  const approvedCount = applications.filter((a) => a.status === "approved_next_stage").length;

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (filterTab === "action_needed" && app.status !== "corrections_required") return false;
    if (filterTab === "review" && !["submitted", "under_review", "resubmitted"].includes(app.status)) return false;
    if (filterTab === "draft" && app.status !== "draft") return false;
    if (filterTab === "approved" && app.status !== "approved_next_stage") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.reference_number?.toLowerCase().includes(q) ||
        app.title?.toLowerCase().includes(q) ||
        app.technical_field?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="portal-container" style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading your patent disclosures and examination telemetry...</p>
      </div>
    );
  }

  const coverGradients = [
    "linear-gradient(135deg,#1e3a5f,#2d6a8f)",
    "linear-gradient(135deg,#1a4a2e,#2d7a4f)",
    "linear-gradient(135deg,#4a1e3a,#7a2d5f)",
    "linear-gradient(135deg,#3a3a1e,#6a6a2d)",
  ];

  return (
    <>
      <PortalHero heading={`Welcome ${currentUser?.full_name} to the MUJ Patent Portal`} subtitle={`${INSTITUTION.NAME} • ${INSTITUTION.DEPARTMENTS.IPR_CELL}`} />

      {/* -- Page body ----------------------------------------------------- */}
      <div className="portal-container" style={{ paddingTop: "24px" }}>

        {/* Notification banner */}
        {notifications.some((n) => !n.is_read) && (
          <div className="alert alert-info" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: "0.85rem" }}>
              <strong>Recent Update:</strong> {notifications.find((n) => !n.is_read)?.message}
            </div>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="alert alert-danger" style={{ marginBottom: "24px" }}>
            <AlertTriangle size={18} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Action required banner */}
        {actionRequiredApps.length > 0 && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1.5px solid #ef4444",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "8px", borderRadius: "6px" }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "0.95rem" }}>
                  Action Required: Revisions Requested on {actionRequiredApps.length} Disclosure{actionRequiredApps.length > 1 ? "s" : ""}
                </div>
<div style={{ fontSize: "0.825rem", color: "#b91c1c", marginTop: "2px" }}>
                    Patent Coordinator <strong>{COORDINATOR.FULL_NAME}</strong> has reviewed your filing and provided itemized feedback. Please review and resubmit to continue examination.
                  </div>
              </div>
            </div>
            <Link
              to={"/applications/" + actionRequiredApps[0].id + "/corrections"}
              className="btn btn-danger btn-sm"
              style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
            >
              Resolve Remarks Now <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* -- KPI stats row ------------------------------------------------ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            { label: "Total Disclosures", value: totalCount, icon: <FileText size={18} color="#2563eb" />, sub: "Recorded in university registry" },
            { label: "Under Examination", value: inReviewCount, icon: <Hourglass size={18} color="#0d9488" />, sub: "Under active coordinator review", valueColor: "#0f766e" },
            { label: "Action Required", value: actionRequiredApps.length, icon: <AlertTriangle size={18} color={actionRequiredApps.length > 0 ? "#e11d48" : "#94a3b8"} />, sub: "Awaiting student resolution", valueColor: actionRequiredApps.length > 0 ? "#be123c" : undefined, cardBg: actionRequiredApps.length > 0 ? "#fff1f2" : undefined },
            { label: "Approved for Filing", value: approvedCount, icon: <CheckCircle2 size={18} color="#16a34a" />, sub: "Forwarded for drafting", valueColor: "#15803d" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="portal-section"
              style={{ marginBottom: 0, padding: "18px 20px", backgroundColor: kpi.cardBg || "var(--portal-card-bg)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {kpi.label}
                </span>
                {kpi.icon}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: kpi.valueColor || "var(--text-primary)", marginTop: "8px" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* -- My Patents section ------------------------------------------- */}
        <div className="portal-section">
          <div className="portal-section-header">
            <h2 className="portal-section-title">
              <ChevronRight size={16} aria-hidden="true" />
              My Patents
            </h2>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Showing {filteredApps.length} of {applications.length} applications
            </span>
            <Link
              to="/applications/new"
              className="btn btn-sm btn-portal-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <PlusCircle size={14} />
              New Disclosure
            </Link>
          </div>

          {/* Filter + Search */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {([
                ["all", "All (" + totalCount + ")"],
                ["action_needed", "Action Needed (" + actionRequiredApps.length + ")"],
                ["review", "In Examination (" + inReviewCount + ")"],
                ["draft", "Drafts (" + draftCount + ")"],
                ["approved", "Approved (" + approvedCount + ")"],
              ] as [typeof filterTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={"btn btn-sm " + (filterTab === tab ? (tab === "action_needed" ? "btn-danger" : "btn-primary") : "btn-outline")}
                  style={{ fontSize: "0.78125rem" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ position: "relative", minWidth: "240px" }}>
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: "30px", fontSize: "0.8125rem", height: "34px" }}
                placeholder="Search by title, reference or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Card grid (Brightspace style) or table fallback */}
          <div style={{ padding: "20px" }}>
            {filteredApps.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--border-medium)",
                  borderRadius: "6px",
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
                  {searchQuery || filterTab !== "all" ? "No Matching Disclosures Found" : "No Patent Applications Drafted Yet"}
                </p>
<p style={{ fontSize: "0.875rem", margin: "0 0 20px" }}>
                    {searchQuery || filterTab !== "all"
                      ? "Try adjusting your search keywords or filter tab to find your application."
                      : "Start your intellectual property journey by filing an invention disclosure through the E-Cell MUJ patent wizard."}
                  </p>
                {!searchQuery && filterTab === "all" && (
                  <Link to="/applications/new" className="btn btn-portal-primary btn-sm">
                    <PlusCircle size={14} /> Draft First Disclosure
                  </Link>
                )}
              </div>
            ) : (
              <div className="portal-card-grid">
                {filteredApps.map((app, idx) => {
                  const isCorrection = app.status === "corrections_required";
                  const isDraft = app.status === "draft";
                  return (
                    <div
                      key={app.id}
                      className="portal-patent-card"
                      style={{ display: "flex", flexDirection: "column", height: "100%" }}
                    >
                      {/* Cover */}
                      <div
                        className="portal-patent-card-cover"
                        style={{
                          background: isCorrection
                            ? "linear-gradient(135deg,#7f1d1d,#b91c1c)"
                            : coverGradients[idx % coverGradients.length],
                          position: "relative",
                        }}
                      >
                        <FileText size={28} color="rgba(255,255,255,0.55)" />
                        {isCorrection && (
                          <span
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "6px",
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "3px",
                              textTransform: "uppercase",
                            }}
                          >
                            Action
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="portal-patent-card-body" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div className="portal-patent-card-title">
                          {app.title || "Untitled Invention Draft"}
                        </div>
                        <div className="portal-patent-card-meta">
                          {app.reference_number || "No reference"} &bull; V{app.current_version}
                        </div>
                        {app.technical_field && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {app.technical_field}
                          </div>
                        )}
                        <div style={{ marginTop: "6px" }}>
                          <span className={getStatusBadgeClass(app.status)} style={{ fontSize: "0.68rem" }}>
                            {getStatusDisplayName(app.status)}
                          </span>
                        </div>
                        {isCorrection && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                              fontWeight: 600,
                            }}
                          >
                            <AlertTriangle size={12} />
                            Specific corrections requested by {COORDINATOR.FULL_NAME}
                          </div>
                        )}
                        <div className="portal-patent-card-meta" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <Clock size={11} />
                          {new Date(app.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>

                        {/* Action button */}
                        <div style={{ marginTop: "auto", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                          {isDraft ? (
                            <Link
                              to={"/applications/" + app.id + "/edit"}
                              className="btn btn-primary btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileEdit size={13} />
                              Continue Draft
                            </Link>
                          ) : isCorrection ? (
                            <Link
                              to={"/applications/" + app.id + "/corrections"}
                              className="btn btn-danger btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertTriangle size={13} />
                              Address Remarks
                            </Link>
                          ) : (
                            <Link
                              to={"/applications/" + app.id}
                              className="btn btn-outline btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: "4px" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye size={13} />
                              View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* -- Quick actions row -------------------------------------------- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Upcoming / Deadlines placeholder (no backend data — show empty state) */}
          <div className="portal-section" style={{ marginBottom: 0 }}>
            <div className="portal-section-header">
              <h2 className="portal-section-title"><ChevronRight size={16} />Upcoming Deadlines</h2>
            </div>
            <div className="portal-section-body">
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                There are no deadlines to display.
              </div>
            </div>
          </div>

          {/* Announcements placeholder */}
          <div className="portal-section" style={{ marginBottom: 0 }}>
            <div className="portal-section-header">
              <h2 className="portal-section-title"><ChevronRight size={16} />Announcements</h2>
            </div>
            <div className="portal-section-body">
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                There are no announcements to display.
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default StudentDashboard;
