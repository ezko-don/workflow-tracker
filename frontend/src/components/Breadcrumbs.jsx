import { Link } from "react-router-dom";

export default function Breadcrumbs({ crumbs }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-sep">›</span>}
            {isLast || !crumb.to
              ? <span className={`breadcrumb-text${isLast ? " active" : ""}`}>{crumb.label}</span>
              : <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
            }
          </span>
        );
      })}
    </nav>
  );
}
