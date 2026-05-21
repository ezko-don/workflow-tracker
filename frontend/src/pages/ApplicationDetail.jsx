import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApplication, submitApplication, startReview, recordDecision,
} from "../api/applications";
import StatusBadge from "../components/StatusBadge";
import WorkflowProgress from "../components/WorkflowProgress";
import Breadcrumbs from "../components/Breadcrumbs";
import { useToast } from "../context/ToastContext";

function Field({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${highlight ? " comment" : ""}`}>{value}</span>
    </div>
  );
}

const DECISION_OPTIONS = [
  { value: "Approved",              label: "Approve",              desc: "Application meets all requirements",       cls: "approve" },
  { value: "Need More Information", label: "Request More Info",    desc: "Applicant needs to provide more details",  cls: "nmi"     },
  { value: "Rejected",              label: "Reject",               desc: "Application does not meet requirements",   cls: "reject"  },
];

function DecisionModal({ onSubmit, onCancel, busy }) {
  const [decision, setDecision] = useState("Approved");
  const [comment, setComment] = useState("");
  const needsComment = decision === "Need More Information" || decision === "Rejected";

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon">⚖️</div>
          <h2>Record Decision</h2>
        </div>

        <div className="form-group" style={{ marginBottom: "0.5rem" }}>
          <label>Decision</label>
          <div className="decision-options">
            {DECISION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`decision-option ${decision === opt.value ? `selected ${opt.cls}` : ""}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={opt.value}
                  checked={decision === opt.value}
                  onChange={() => setDecision(opt.value)}
                />
                <div>
                  <div className="decision-option-label">{opt.label}</div>
                  <div className="decision-option-desc">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>
            Reviewer Comment
            {needsComment
              ? <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>
              : <span style={{ color: "var(--slate-400)", fontSize: "0.78rem", marginLeft: "6px" }}>(optional)</span>
            }
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={needsComment ? "Explain what additional information is needed…" : "Add a comment…"}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            className={`btn ${decision === "Approved" ? "btn-success" : decision === "Rejected" ? "btn-danger" : "btn-warning"}`}
            disabled={busy || (needsComment && !comment.trim())}
            onClick={() => onSubmit({ decision, reviewer_comment: comment })}
          >
            {busy ? "Submitting…" : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = async (fn, successMsg) => {
    setError(null);
    setActionBusy(true);
    try {
      const updated = await fn();
      setApp(updated);
      if (successMsg) success(successMsg.title, successMsg.message);
    }
    catch (e) { setError(e.message); toastError("Action failed", e.message); }
    finally { setActionBusy(false); }
  };

  const handleDecision = async (payload) => {
    const labels = { Approved: "Approved", Rejected: "Rejected", "Need More Information": "Returned for more info" };
    await doAction(
      () => recordDecision(id, payload),
      { title: labels[payload.decision] || "Decision recorded", message: payload.reviewer_comment || undefined }
    );
    setShowDecisionModal(false);
  };

  if (loading) return <div className="page-loading">Loading application</div>;
  if (!app)    return <div className="alert alert-error">{error || "Application not found."}</div>;

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="page">
      {showDecisionModal && (
        <DecisionModal
          onSubmit={handleDecision}
          onCancel={() => setShowDecisionModal(false)}
          busy={actionBusy}
        />
      )}

      <Breadcrumbs crumbs={[
        { label: "Applications", to: "/" },
        { label: app.tracking_number },
      ]} />

      <div className="page-header">
        <div className="page-header-left">
          <span className="tracking">Application</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1>{app.tracking_number}</h1>
            <StatusBadge status={app.status} />
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          ← Back
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <WorkflowProgress status={app.status} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="detail-card">
          <div className="detail-card-title">Applicant</div>
          <Field label="Name"  value={app.applicant_name} />
          <Field label="Email" value={app.applicant_email} />
          <Field label="Company" value={app.company_name} />
          <Field label="Type" value={app.application_type} />
        </div>

        <div className="detail-card">
          <div className="detail-card-title">Timeline</div>
          <Field label="Created"      value={fmt(app.created_at)} />
          <Field label="Submitted"    value={fmt(app.submitted_at)} />
          <Field label="Last Reviewed" value={fmt(app.reviewed_at)} />
          <Field label="Last Updated" value={fmt(app.updated_at)} />
        </div>
      </div>

      <div className="detail-card" style={{ marginTop: "1rem" }}>
        <div className="detail-card-title">Description</div>
        <p style={{ fontSize: "0.9rem", color: "var(--slate-700)", lineHeight: 1.7 }}>
          {app.description}
        </p>
        {app.reviewer_comment && (
          <>
            <div className="divider" style={{ margin: "1rem 0" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: "8px", padding: "0.75rem 1rem", flex: 1,
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
                  Reviewer Comment
                </div>
                <p style={{ fontSize: "0.875rem", color: "#78350f", lineHeight: 1.6 }}>
                  {app.reviewer_comment}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="action-bar">
        {app.status === "Draft" && (
          <>
            <button className="btn btn-secondary" onClick={() => navigate(`/applications/${id}/edit`)}>
              ✏️ Edit
            </button>
            <button className="btn btn-primary" disabled={actionBusy} onClick={() => doAction(
              () => submitApplication(id),
              { title: "Application submitted", message: "It is now awaiting review." }
            )}>
              {actionBusy ? "Submitting…" : "📤 Submit Application"}
            </button>
          </>
        )}

        {app.status === "Submitted" && (
          <button className="btn btn-primary" disabled={actionBusy} onClick={() => doAction(
            () => startReview(id),
            { title: "Review started", message: "The application is now under review." }
          )}>
            {actionBusy ? "Starting…" : "🔍 Start Review"}
          </button>
        )}

        {app.status === "Under Review" && (
          <button className="btn btn-primary" onClick={() => setShowDecisionModal(true)}>
            ⚖️ Record Decision
          </button>
        )}

        {app.status === "Need More Information" && (
          <button className="btn btn-warning" onClick={() => navigate(`/applications/${id}/edit`)}>
            ✏️ Edit & Resubmit
          </button>
        )}

        {(app.status === "Approved" || app.status === "Rejected") && (
          <span style={{ color: "var(--slate-400)", fontSize: "0.875rem", padding: "0.5rem 0" }}>
            This application is closed — no further actions available.
          </span>
        )}
      </div>
    </div>
  );
}
