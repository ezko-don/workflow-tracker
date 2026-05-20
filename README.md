# Workflow Tracker

A mini application workflow tracker built with Django Ninja (backend) and React + Vite (frontend).

## Workflow

```
Draft → Submitted → Under Review → Approved
                                 → Need More Information → (edit & resubmit) → Under Review
                                 → Rejected
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+

---

## Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

Interactive API docs (Django Ninja): `http://localhost:8000/api/docs`

---

## Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint                          | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | `/api/applications/`              | Create draft            |
| GET    | `/api/applications/`              | List all applications   |
| GET    | `/api/applications/{id}`          | Get application detail  |
| PUT    | `/api/applications/{id}`          | Update draft            |
| POST   | `/api/applications/{id}/submit`   | Submit application      |
| POST   | `/api/applications/{id}/review`   | Start review            |
| POST   | `/api/applications/{id}/decide`   | Record reviewer decision|

---

## Assumptions

- No authentication or user roles — the reviewer actions are available to anyone.
- SQLite is used for the database (zero-config for development).
- Tracking numbers are auto-generated as `TRK-{8 hex chars}` on creation.
- A `Need More Information` application can be edited and then resubmitted (moves it back to `Submitted`).

---

## What I Would Improve With More Time

- Add JWT authentication and separate applicant / reviewer roles.
- Add server-side pagination and filtering/search on the list endpoint.
- Replace SQLite with PostgreSQL for production.
- Write unit tests for the workflow transition logic.
- Add toast notifications in the frontend instead of inline error banners.
- Improve mobile responsiveness of the table layout.
