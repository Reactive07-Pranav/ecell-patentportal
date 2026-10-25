/**
 * PortalLayout - Student-facing portal only.
 * Admin and super_admin routes continue to use RootLayout unchanged.
 */
import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import {
  LogOut,
  Settings,
  FolderKanban,
  PlusCircle,
  BookOpen,
  Home,
  ChevronRight,
} from "lucide-react";
import { INSTITUTION, COORDINATOR } from "../config/constants";
import { GuidelinesModal } from "../components/GuidelinesModal";

/* --- Logo helpers -------------------------------------------------------- */

function useLogo(src: string): boolean {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = src;
  }, [src]);
  return ok;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const MujLogo: React.FC<{ height?: number }> = ({ height = 52 }) => {
  const ok = useLogo("/assets/muj-logo.png");
  if (ok) {
    return (
      <img
        src="/assets/muj-logo.png"
        alt="Manipal University Jaipur"
        style={{ height, width: "auto", objectFit: "contain", display: "block" }}
      />
    );
  }
  return (
    <div
      className="portal-logo-placeholder"
      style={{ height }}
      aria-label="Manipal University Jaipur"
    >
      MUJ
    </div>
  );
};

const EcellLogo: React.FC<{ height?: number }> = ({ height = 52 }) => {
  const ok = useLogo("/assets/muj-ecell-logo.png");
  if (ok) {
    return (
      <img
        src="/assets/muj-ecell-logo.png"
        alt="MUJ E-Cell"
        style={{ height, width: "auto", objectFit: "contain", display: "block" }}
      />
    );
  }
  return (
    <div
      className="portal-logo-placeholder"
      style={{ height }}
      aria-label="MUJ E-Cell"
    >
      E-CELL
    </div>
  );
};

/* --- Main layout --------------------------------------------------------- */

export const PortalLayout: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isLogin = location.pathname === "/login";
const isActive = (path: string) => location.pathname === path;

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
<div className="portal" style={isLogin ? { backgroundColor: "transparent", minHeight: "100vh", display: "flex", flexDirection: "column" } : undefined}>
      {/* Header */}
      {!isLogin && (
      <header className="portal-header" role="banner">
        <div className="portal-header-inner">
          <Link
            to="/"
            className="portal-logo-group"
            aria-label="MUJ Patent Portal home"
            style={{ textDecoration: "none" }}
          >
            <MujLogo height={52} />
            <span className="portal-logo-divider" aria-hidden="true" />
            <EcellLogo height={52} />
          </Link>

          <div className="portal-user-chip">
            {currentUser ? (
              <>
                <div className="portal-avatar" aria-hidden="true">
                  {initials(currentUser.full_name || "U")}
                </div>
                <div>
                  <div className="portal-user-name">{currentUser.full_name}</div>
                  <div className="portal-user-role">Student Applicant</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuidelinesOpen(true)}
                  aria-label="IPR guidelines and help"
                  title="IPR & Patent Filing Rules"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    padding: "6px",
                    borderRadius: "4px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                >
                  <Settings size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.8125rem",
                    color: "#ef4444",
                    borderColor: "rgba(239,68,68,0.35)",
                  }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-sm"
                style={{
                  backgroundColor: "var(--portal-subnav)",
                  color: "#fff",
                  borderColor: "var(--portal-subnav)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                Sign In <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
</header>
      )}

{/* Sub-nav */}
      {!isLogin && (
      <nav className="portal-subnav" aria-label="Portal navigation">
        <div className="portal-subnav-inner">
          <ul className="portal-subnav-links" role="list">
            <li>
              <Link
                to="/dashboard"
                className={"portal-subnav-link" + (isActive("/dashboard") ? " active" : "")}
                aria-current={isActive("/dashboard") ? "page" : undefined}
              >
                <Home size={14} aria-hidden="true" />
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard"
                className={"portal-subnav-link" + (
                  location.pathname.startsWith("/applications") &&
                  !location.pathname.includes("/new")
                    ? " active"
                    : ""
                )}
              >
                <FolderKanban size={14} aria-hidden="true" />
                My Patents
              </Link>
            </li>
            <li>
              <Link
                to="/applications/new"
                className={"portal-subnav-link" + (isActive("/applications/new") ? " active" : "")}
                aria-current={isActive("/applications/new") ? "page" : undefined}
              >
                <PlusCircle size={14} aria-hidden="true" />
                Submit Patent
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="portal-subnav-link"
                onClick={() => setIsGuidelinesOpen(true)}
              >
                <BookOpen size={14} aria-hidden="true" />
                Help
              </button>
            </li>
          </ul>
          <span className="portal-subnav-date">{todayLabel}</span>
        </div>
</nav>
      )}

      {/* Main content */}
      <main className="portal-main" id="main-content" style={isLogin ? { flex: 1, display: "flex", flexDirection: "column" } : undefined}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="portal-footer" role="contentinfo">
        <div className="portal-footer-inner">
          <EcellLogo height={40} />
          <p className="portal-footer-text" style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} {INSTITUTION.NAME}. All rights reserved.
            Developed by <strong>E-Cell MUJ</strong> in partnership with the{" "}
            {INSTITUTION.DEPARTMENTS.IPR_CELL}.
          </p>
          <p className="portal-footer-text" style={{ margin: 0 }}>
            Patent enquiries:{" "}
            <a href={"mailto:" + COORDINATOR.EMAIL} style={{ color: "var(--portal-blue)" }}>
              {COORDINATOR.EMAIL}
            </a>
          </p>
        </div>
      </footer>

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
};

export default PortalLayout;
