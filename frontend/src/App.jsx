import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import ApplicationList from "./pages/ApplicationList";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import "./index.css";

function NavBar() {
  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">Workflow Tracker</a>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.04em" }}>
        Draft → Submitted → Under Review → Decision
      </span>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ApplicationList />} />
            <Route path="/new" element={<ApplicationForm />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/applications/:id/edit" element={<ApplicationForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </ToastProvider>
    </BrowserRouter>
  );
}
