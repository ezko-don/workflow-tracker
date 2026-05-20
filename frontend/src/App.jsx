import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ApplicationList from "./pages/ApplicationList";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import "./index.css";

function NavBar() {
  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">Workflow Tracker</a>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
