const STYLES = {
  Draft:                  { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  Submitted:              { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  "Under Review":         { bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
  "Need More Information":{ bg: "#ffedd5", color: "#c2410c", border: "#fdba74" },
  Approved:               { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  Rejected:               { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" };
  return (
    <span
      className="badge"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}
