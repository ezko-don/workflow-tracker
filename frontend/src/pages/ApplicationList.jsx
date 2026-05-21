import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listApplications } from "../api/applications";
import StatusBadge from "../components/StatusBadge";
import Breadcrumbs from "../components/Breadcrumbs";
import { useToast } from "../context/ToastContext";

const STAT_DEFS = [
  { label: "Draft",         key: "Draft",                   color: "#64748b" },
  { label: "Submitted",     key: "Submitted",               color: "#2563eb" },
  { label: "Under Review",  key: "Under Review",            color: "#d97706" },
  { label: "Needs Info",    key: "Need More Information",   color: "#ea580c" },
  { label: "Approved",      key: "Approved",                color: "#16a34a" },
  { label: "Rejected",      key: "Rejected",                color: "#dc2626" },
];

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  useEffect(() => {
    listApplications()
      .then(setApplications)
      .catch((e) => { setError(e.message); toastError("Failed to load", e.message); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading applications</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const counts = Object.fromEntries(STAT_DEFS.map((s) => [s.key, 0]));
  applications.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status]++; });

  return (
    <div className="page">
      <Breadcrumbs crumbs={[{ label: "Applications" }]} />
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p style={{ color: "var(--slate-500)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
            {applications.length} total application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/new")}>
          + New Application
        </button>
      </div>

      {/* Stats bar */}
      {applications.length > 0 && (
        <div style={{
          display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap",
        }}>
          {STAT_DEFS.map((s) => (
            <div key={s.key} style={{
              background: "#fff", borderRadius: "10px", padding: "0.85rem 1.1rem",
              boxShadow: "var(--shadow)", display: "flex", flexDirection: "column",
              gap: "0.2rem", flex: "1", minWidth: "100px", borderTop: `3px solid ${s.color}`,
            }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {counts[s.key]}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--slate-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No applications yet.</p>
          <button className="btn btn-primary" onClick={() => navigate("/new")}>
            Create your first application
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Applicant</th>
                <th>Company</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="clickable-row"
                >
                  <td><span className="tracking-code">{app.tracking_number}</span></td>
                  <td style={{ fontWeight: 500 }}>{app.applicant_name}</td>
                  <td style={{ color: "var(--slate-500)" }}>{app.company_name}</td>
                  <td style={{ color: "var(--slate-500)" }}>{app.application_type}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td style={{ color: "var(--slate-400)", fontSize: "0.82rem" }}>
                    {new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
