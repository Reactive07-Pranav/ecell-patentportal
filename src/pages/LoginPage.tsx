import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building,
  Phone,
  Hash,
} from "lucide-react";
import { INSTITUTION } from "../config/constants";

export const LoginPage: React.FC = () => {
  const { signInWithEmail, registerUniversityAccount, signOut, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [audience, setAudience] = useState<"candidate" | "admin">("candidate");

  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register State
  const [regEmail, setRegEmail] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe redirect on authentication.
  // The REAL role is read from the signed-in profile - the toggle is never trusted for access.
  React.useEffect(() => {
    if (!currentUser) return;

    const role = currentUser.role;
    const isAdminAudience = audience === "admin";
    const roleMatches = isAdminAudience
      ? role === "admin" || role === "super_admin"
      : role === "student";

    if (!roleMatches) {
      setSuccessNotice(null);
      setErrorMessage(
        `This account is not registered as ${isAdminAudience ? "Admin" : "Candidate"}. Please choose the correct option.`
      );
      signOut();
      return;
    }

    const fromPath = (location.state as any)?.from?.pathname;
    const fromIsAdminPath = fromPath
      ? fromPath.startsWith("/admin") || fromPath.startsWith("/superadmin")
      : false;
    const roleDashboard =
      role === "super_admin"
        ? "/superadmin/dashboard"
        : isAdminAudience
        ? "/admin/dashboard"
        : "/dashboard";
    const destination =
      fromPath &&
      fromPath !== "/" &&
      fromPath !== "/login" &&
      fromPath !== "/auth/login" &&
      (isAdminAudience ? fromIsAdminPath : !fromIsAdminPath)
        ? fromPath
        : roleDashboard;
    navigate(destination, { replace: true });
  }, [currentUser, audience, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const result = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessNotice("Identity verified. Accessing secure portal...");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters in length.");
      return;
    }

    setIsSubmitting(true);
    const result = await registerUniversityAccount({
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      department: regDepartment,
      registrationNumber: regNumber,
      phone: regPhone,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      setSuccessNotice("University account successfully registered! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 400);
    }
  };

  return (
    <div className="portal-login-page">
      {/* Both logos on white background */}
      <div className="portal-login-logos" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <img
          src="/assets/muj-logo-transparent.png"
          alt="Manipal University Jaipur"
          style={{ height: "64px", width: "auto", objectFit: "contain" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <span
          className="portal-logo-divider"
          aria-hidden="true"
          style={{ height: "40px" }}
        />
        <img
          src="/assets/muj-ecell-logo.png"
          alt="MUJ E-Cell"
          style={{ height: "64px", width: "auto", objectFit: "contain" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* Page title */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          MUJ Patent &amp; IPR Portal
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "480px" }}>
          Unified intellectual property disclosure system by <strong>E-Cell MUJ</strong> &amp; the{" "}
          <strong>Directorate of Research &amp; IPR Cell</strong>.
        </p>
      </div>

      {/* Auth card */}
      <div className="card" style={{ width: "100%", maxWidth: "500px", boxShadow: "var(--portal-card-shadow)", borderRadius: "8px", overflow: "hidden" }}>
        <div className="card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px", padding: "22px 24px 14px", borderBottom: "none" }}>
          {/* Account audience switch */}
          <div
            role="group"
            aria-label="Account type"
            style={{
              display: "flex",
              width: "100%",
              gap: "4px",
              padding: "4px",
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            {(["candidate", "admin"] as const).map((option) => {
              const isSelected = audience === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setAudience(option);
                    setActiveTab("signin");
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  style={{
                    flex: 1,
                    width: "100%",
                    minWidth: 0,
                    padding: "9px 12px",
                    background: isSelected ? "var(--portal-subnav)" : "transparent",
                    color: isSelected ? "#FFFFFF" : "var(--text-muted)",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                >
                  {option === "candidate" ? "Candidate" : "Admin"}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--portal-subnav)" }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Institutional Access Gate
            </span>
          </div>
          <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>
            {audience === "admin"
              ? "Admin Sign In"
              : activeTab === "signin"
              ? "Sign In with University Credentials"
              : "Register New University Account"}
          </h2>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {audience === "admin"
              ? "Authorized MUJ staff only"
              : `Authorized portal for ${INSTITUTION.NAME} students and research coordinators.`}
          </p>

          {/* Tab switcher */}
          {audience === "candidate" && (
          <div style={{ display: "flex", width: "100%", marginTop: "14px", borderBottom: "1px solid var(--border-light)" }}>
            {(["signin", "register"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setErrorMessage(null); setSuccessNotice(null); }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid var(--portal-subnav)" : "2px solid transparent",
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: "0.875rem",
                  color: activeTab === tab ? "var(--portal-subnav)" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {tab === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          )}
        </div>

        <div className="card-body" style={{ padding: "20px 24px 28px" }}>
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: "18px" }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}
          {successNotice && (
            <div className="alert alert-success" style={{ marginBottom: "18px" }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{successNotice}</div>
            </div>
          )}

          {activeTab === "signin" || audience === "admin" ? (
            <form onSubmit={handleSignIn}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label htmlFor="login-email" className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  University Email Address <span className="required">*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Mail size={16} /></span>
                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: "38px" }}
                    placeholder={"name" + INSTITUTION.EMAIL_AT_DOMAIN}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "22px" }}>
                <label htmlFor="login-password" className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  Password <span className="required">*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Lock size={16} /></span>
                  <input
                    id="login-password"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: "38px" }}
                    placeholder="Enter your university account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-portal-primary"
                style={{ width: "100%", padding: "10px 16px", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Authenticating..." : "Sign In to Portal"}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  University Email <span className="required">*</span>
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Mail size={16} /></span>
                  <input type="email" className="form-control" style={{ paddingLeft: "38px" }} placeholder={"name" + INSTITUTION.EMAIL_AT_DOMAIN} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Full Legal Name <span className="required">*</span></label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><User size={16} /></span>
                  <input type="text" className="form-control" style={{ paddingLeft: "38px" }} placeholder="e.g. Aditya Sharma" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required />
                </div>
              </div>

              <div className="grid-2" style={{ gap: "12px", marginBottom: "14px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Department</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Building size={16} /></span>
                    <input type="text" className="form-control" style={{ paddingLeft: "38px" }} placeholder="e.g. Computer Science" value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Registration No.</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Hash size={16} /></span>
                    <input type="text" className="form-control" style={{ paddingLeft: "38px" }} placeholder="e.g. 219301234" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Contact Phone</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: "12px", color: "var(--text-muted)" }}><Phone size={16} /></span>
                  <input type="tel" className="form-control" style={{ paddingLeft: "38px" }} placeholder="+91 9876543210" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: "12px", marginBottom: "22px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Password <span className="required">*</span></label>
                  <input type="password" className="form-control" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Confirm Password <span className="required">*</span></label>
                  <input type="password" className="form-control" placeholder="Re-enter password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-portal-primary"
                style={{ width: "100%", padding: "10px 16px", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering Account..." : "Complete Registration"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Statutory notice */}
          <div style={{ marginTop: "22px", padding: "12px 14px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
            <strong>Indian Patents Act 1970 Notice:</strong> India operates on a strict first-to-file regime.
            All invention disclosures remain protected by university confidentiality under Section 39 clearance protocols.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
