const STEPS = [
  { key: "Draft",                   label: "Draft",        icon: "✏️" },
  { key: "Submitted",               label: "Submitted",    icon: "📤" },
  { key: "Under Review",            label: "Under Review", icon: "🔍" },
];

const TERMINAL = {
  Approved:               { label: "Approved",    icon: "✅", cls: "terminal-pass" },
  Rejected:               { label: "Rejected",    icon: "❌", cls: "terminal-fail" },
  "Need More Information":{ label: "More Info",   icon: "⚠️", cls: "terminal-warn" },
};

const ORDER = ["Draft", "Submitted", "Under Review"];

export default function WorkflowProgress({ status }) {
  const mainIdx = ORDER.indexOf(status);
  const isTerminal = Boolean(TERMINAL[status]);
  const terminal = TERMINAL[status];

  return (
    <div className="workflow-bar">
      {STEPS.map((step, i) => {
        const isDone   = isTerminal ? true : mainIdx > i;
        const isActive = !isTerminal && mainIdx === i;
        const cls = isDone ? "done" : isActive ? "active" : "";

        return (
          <div key={step.key} style={{ display: "contents" }}>
            <div className={`wf-step ${cls}`}>
              <div className="wf-step-dot">
                {isDone ? "✓" : isActive ? step.icon : i + 1}
              </div>
              <span className="wf-step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wf-connector ${isDone ? "done" : ""}`} />
            )}
          </div>
        );
      })}

      {/* connector to terminal */}
      <div className={`wf-connector ${isTerminal ? "done" : ""}`} />

      {isTerminal ? (
        <div className={`wf-step ${terminal.cls}`}>
          <div className="wf-step-dot">{terminal.icon}</div>
          <span className="wf-step-label">{terminal.label}</span>
        </div>
      ) : (
        <div className="wf-step">
          <div className="wf-step-dot" style={{ fontSize: "0.9rem" }}>⋯</div>
          <span className="wf-step-label">Decision</span>
        </div>
      )}
    </div>
  );
}
