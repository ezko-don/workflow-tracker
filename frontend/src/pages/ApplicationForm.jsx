import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createApplication,
  getApplication,
  updateApplication,
  submitApplication,
} from "../api/applications";

const APPLICATION_TYPES = [
  "Recordation",
  "Renewal",
  "Change of Ownership",
  "Change of Name",
  "Discontinuation",
];

const EMPTY_FORM = {
  applicant_name: "",
  applicant_email: "",
  company_name: "",
  application_type: "",
  description: "",
};

export default function ApplicationForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [appStatus, setAppStatus] = useState(null);

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
        navigate(`/applications/${id}`);
      } else {
        const app = await createApplication(form);
        navigate(`/applications/${app.id}`);
      }
    } catch (err) {
      setError(err.message);
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
      if (isEditing) {
        await updateApplication(id, form);
      } else {
        const app = await createApplication(form);
        appId = app.id;
      }
      await submitApplication(appId);
      navigate(`/applications/${appId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  const isResubmit = appStatus === "Need More Information";

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? (isResubmit ? "Edit & Resubmit Application" : "Edit Application") : "New Application"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form-card" onSubmit={handleSave}>
        <div className="form-group">
          <label>Applicant Name</label>
          <input
            name="applicant_name"
            value={form.applicant_name}
            onChange={handleChange}
            required
            placeholder="Full name"
          />
        </div>

        <div className="form-group">
          <label>Applicant Email</label>
          <input
            name="applicant_email"
            type="email"
            value={form.applicant_email}
            onChange={handleChange}
            required
            placeholder="email@example.com"
          />
        </div>

        <div className="form-group">
          <label>Company Name</label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            placeholder="Company or organisation"
          />
        </div>

        <div className="form-group">
          <label>Application Type</label>
          <select
            name="application_type"
            value={form.application_type}
            onChange={handleChange}
            required
          >
            <option value="">— Select type —</option>
            {APPLICATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Describe the application…"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(isEditing ? `/applications/${id}` : "/")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-secondary" disabled={saving}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSaveAndSubmit}>
            {saving ? "Submitting…" : isResubmit ? "Save & Resubmit" : "Save & Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
