import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listApplications } from "../api/applications";
import StatusBadge from "../components/StatusBadge";

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    listApplications()
      .then(setApplications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading applications…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Applications</h1>
        <button className="btn btn-primary" onClick={() => navigate("/new")}>
          + New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
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
                <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)} className="clickable-row">
                  <td><code>{app.tracking_number}</code></td>
                  <td>{app.applicant_name}</td>
                  <td>{app.company_name}</td>
                  <td>{app.application_type}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
