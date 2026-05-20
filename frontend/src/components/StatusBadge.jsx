const COLORS = {
  Draft: { bg: "#e2e8f0", color: "#475569" },
  Submitted: { bg: "#dbeafe", color: "#1d4ed8" },
  "Under Review": { bg: "#fef9c3", color: "#854d0e" },
  "Need More Information": { bg: "#ffedd5", color: "#c2410c" },
  Approved: { bg: "#dcfce7", color: "#15803d" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

export default function StatusBadge({ status }) {
  const style = COLORS[status] || { bg: "#f1f5f9", color: "#334155" };
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
