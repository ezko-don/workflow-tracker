import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createApplication, getApplication, updateApplication, submitApplication,
} from "../api/applications";
import Breadcrumbs from "../components/Breadcrumbs";
import { useToast } from "../context/ToastContext";

const APPLICATION_TYPES = [
  "Recordation", "Renewal", "Change of Ownership", "Change of Name", "Discontinuation",
];

const EMPTY_FORM = {
  applicant_name: "", applicant_email: "", company_name: "",
  application_type: "", description: "",
};

export default function ApplicationForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);

  useEffect(() => {
    if (!isEditing) return;
    getApplication(id)
      .then((app) => {
        setForm({
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          company_name: app.company_name,
          application_type: app.application_type,
          description: app.description,
        });
        setAppStatus(app.status);
        setTrackingNumber(app.tracking_number);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEditing) {
        await updateApplication(id, form);
        success("Draft saved", "Your changes have been saved.");
        navigate(`/applications/${id}`);
      } else {
        const app = await createApplication(form);
        success("Draft created", `Tracking number: ${app.tracking_number}`);
        navigate(`/applications/${app.id}`);
      }
    } catch (err) {
      setError(err.message);
      toastError("Save failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let appId = id;
      let tracking = trackingNumber;
      if (isEditing) {
        await updateApplication(id, form);
      } else {
        const app = await createApplication(form);
        appId = app.id;
        tracking = app.tracking_number;
      }
      await submitApplication(appId);
      success(
        isResubmit ? "Application resubmitted" : "Application submitted",
        `${tracking} is now awaiting review.`
      );
      navigate(`/applications/${appId}`);
    } catch (err) {
      setError(err.message);
      toastError("Submit failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading application</div>;

  const isResubmit = appStatus === "Need More Information";

  const crumbs = [
    { label: "Applications", to: "/" },
    ...(isEditing ? [{ label: trackingNumber || `#${id}`, to: `/applications/${id}` }] : []),
    { label: isResubmit ? "Edit & Resubmit" : isEditing ? "Edit" : "New Application" },
  ];

  return (
    <div className="page">
      <Breadcrumbs crumbs={crumbs} />

      <div className="page-header">
        <div className="page-header-left">
          <span className="tracking">{isEditing ? "Edit Application" : "New Application"}</span>
          <h1>{isResubmit ? "Edit & Resubmit" : isEditing ? "Update Draft" : "Create Application"}</h1>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(isEditing ? `/applications/${id}` : "/")}>
          ← Cancel
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-card" onSubmit={handleSave}>
        <div className="form-section-title">Applicant Details</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div className="form-group">
            <label>Full Name <span style={{ color: "#dc2626" }}>*</span></label>
            <input name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="e.g. Jane Doe" />
          </div>
          <div className="form-group">
            <label>Email Address <span style={{ color: "#dc2626" }}>*</span></label>
            <input name="applicant_email" type="email" value={form.applicant_email} onChange={handleChange} required placeholder="jane@company.com" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          <div className="form-group">
            <label>Company / Organisation <span style={{ color: "#dc2626" }}>*</span></label>
            <input name="company_name" value={form.company_name} onChange={handleChange} required placeholder="Company name" />
          </div>
          <div className="form-group">
            <label>Application Type <span style={{ color: "#dc2626" }}>*</span></label>
            <select name="application_type" value={form.application_type} onChange={handleChange} required>
              <option value="">— Select type —</option>
              {APPLICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-section-title" style={{ marginTop: "0.5rem" }}>Application Details</div>

        <div className="form-group">
          <label>Description <span style={{ color: "#dc2626" }}>*</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Describe the purpose and details of this application…"
          />
        </div>

        {isResubmit && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px",
            padding: "0.75rem 1rem", marginBottom: "0.5rem", fontSize: "0.83rem", color: "#92400e",
          }}>
            ⚠️ This application was returned for more information. Update the details above then click <strong>Save & Resubmit</strong>.
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-secondary" disabled={saving}>
            💾 Save Draft
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSaveAndSubmit}>
            {saving ? "Submitting…" : isResubmit ? "📤 Save & Resubmit" : "📤 Save & Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
