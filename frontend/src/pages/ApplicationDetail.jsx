import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApplication,
  submitApplication,
  startReview,
  recordDecision,
} from "../api/applications";
import StatusBadge from "../components/StatusBadge";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function DecisionModal({ onSubmit, onCancel, busy }) {
  const [decision, setDecision] = useState("Approved");
  const [comment, setComment] = useState("");
  const needsComment = decision === "Need More Information" || decision === "Rejected";

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Record Decision</h2>

        <div className="form-group">
          <label>Decision</label>
          <select value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="Approved">Approve</option>
            <option value="Need More Information">Need More Information</option>
            <option value="Rejected">Reject</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Reviewer Comment{needsComment ? " (required)" : " (optional)"}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Add a comment…"
            required={needsComment}
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            className="btn btn-primary"
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

  const reload = () =>
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { reload(); }, [id]);

  const doAction = async (fn) => {
    setError(null);
    setActionBusy(true);
    try {
      const updated = await fn();
      setApp(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDecision = async (payload) => {
    await doAction(() => recordDecision(id, payload));
    setShowDecisionModal(false);
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!app) return <div className="alert alert-error">{error || "Application not found."}</div>;

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : "—";

  return (
    <div className="page">
      {showDecisionModal && (
        <DecisionModal
          onSubmit={handleDecision}
          onCancel={() => setShowDecisionModal(false)}
          busy={actionBusy}
        />
      )}

      <div className="page-header">
        <div>
          <h1>{app.tracking_number}</h1>
          <StatusBadge status={app.status} />
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          ← Back to List
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-card">
        <h2>Applicant Details</h2>
        <Field label="Applicant Name" value={app.applicant_name} />
        <Field label="Applicant Email" value={app.applicant_email} />
        <Field label="Company Name" value={app.company_name} />
        <Field label="Application Type" value={app.application_type} />
      </div>

      <div className="detail-card">
        <h2>Application Details</h2>
        <Field label="Description" value={app.description} />
        {app.reviewer_comment && (
          <Field label="Reviewer Comment" value={app.reviewer_comment} />
        )}
      </div>

      <div className="detail-card">
        <h2>Timeline</h2>
        <Field label="Created" value={fmt(app.created_at)} />
        <Field label="Submitted" value={fmt(app.submitted_at)} />
        <Field label="Last Reviewed" value={fmt(app.reviewed_at)} />
        <Field label="Last Updated" value={fmt(app.updated_at)} />
      </div>

      <div className="action-bar">
        {app.status === "Draft" && (
          <>
            <button className="btn btn-secondary" onClick={() => navigate(`/applications/${id}/edit`)}>
              Edit
            </button>
            <button className="btn btn-primary" disabled={actionBusy} onClick={() => doAction(() => submitApplication(id))}>
              {actionBusy ? "Submitting…" : "Submit"}
            </button>
          </>
        )}

        {app.status === "Submitted" && (
          <button className="btn btn-primary" disabled={actionBusy} onClick={() => doAction(() => startReview(id))}>
            {actionBusy ? "Starting…" : "Start Review"}
          </button>
        )}

        {app.status === "Under Review" && (
          <button className="btn btn-primary" onClick={() => setShowDecisionModal(true)}>
            Record Decision
          </button>
        )}

        {app.status === "Need More Information" && (
          <button className="btn btn-primary" onClick={() => navigate(`/applications/${id}/edit`)}>
            Edit & Resubmit
          </button>
        )}
      </div>
    </div>
  );
}
