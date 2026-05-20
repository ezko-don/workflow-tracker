# Mini Application Workflow Tracker — Requirements

## Overview

A small full-stack application workflow tracker built with a Django Ninja backend API and a React frontend. The system manages applications through a defined approval lifecycle.

---

## Workflow

```
Draft → Submitted → Under Review → Need More Information → (resubmit) → Under Review
                                 → Approved
                                 → Rejected
```

---

## Backend

### Stack

- Python / Django
- [Django Ninja](https://django-ninja.dev/) for the REST API

### Data Model: `Application`

| Field               | Type         | Notes                                      |
|---------------------|--------------|--------------------------------------------|
| `tracking_number`   | string       | Auto-generated unique identifier           |
| `applicant_name`    | string       |                                            |
| `applicant_email`   | email        |                                            |
| `company_name`      | string       |                                            |
| `application_type`  | choice       | See types below                            |
| `description`       | text         |                                            |
| `status`            | choice       | See statuses below; default `Draft`        |
| `reviewer_comment`  | text         | Required when status is `Need More Information` or `Rejected` |
| `created_at`        | datetime     | Auto-set on creation                       |
| `updated_at`        | datetime     | Auto-updated on save                       |
| `submitted_at`      | datetime     | Set when application is submitted          |
| `reviewed_at`       | datetime     | Set when reviewer records a decision       |

#### Application Types

- Recordation
- Renewal
- Change of Ownership
- Change of Name
- Discontinuation

#### Statuses

- Draft
- Submitted
- Under Review
- Need More Information
- Approved
- Rejected

---

### API Endpoints

| Method | Path                              | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | `/api/applications/`              | Create a new draft            |
| GET    | `/api/applications/`              | List all applications         |
| GET    | `/api/applications/{id}/`         | View application details      |
| PUT    | `/api/applications/{id}/`         | Update a draft application    |
| POST   | `/api/applications/{id}/submit/`  | Submit application            |
| POST   | `/api/applications/{id}/review/`  | Start review (move to Under Review) |
| POST   | `/api/applications/{id}/decide/`  | Record reviewer decision      |

---

### Workflow Rules

| Rule | Detail |
|------|--------|
| Edit | Only `Draft` and `Need More Information` applications can be edited |
| Submit | Only `Draft` applications can be submitted |
| Start Review | Only `Submitted` applications can move to `Under Review` |
| Reviewer Decision | Only `Under Review` applications can receive a decision |
| Approved / Rejected | Cannot be edited |
| Need More Information | Can be edited and resubmitted |
| Reviewer Comment | **Required** when status is `Need More Information` or `Rejected` |

---

## Frontend

### Stack

- React (functional components, hooks)
- Any HTTP client (fetch / axios)

### Screens

#### 1. Application List Screen

Displays a table/list of all applications with:

- Tracking number
- Applicant name
- Company name
- Application type
- Status (with visual indicator)
- Created date
- Link to detail page

Includes a button to create a new application.

#### 2. Create / Edit Application Form

Fields:
- Applicant name
- Applicant email
- Company name
- Application type (dropdown)
- Description

Available when:
- Creating a new draft
- Editing a `Draft` application
- Editing a `Need More Information` application

#### 3. Application Detail Screen

Shows all application fields and timestamps.

Status-based action buttons:

| Status                  | Available Actions                      |
|-------------------------|----------------------------------------|
| Draft                   | Edit, Submit                           |
| Submitted               | Start Review                           |
| Under Review            | Approve, Need More Information, Reject |
| Need More Information   | Edit, Resubmit                         |
| Approved                | None                                   |
| Rejected                | None                                   |

#### 4. Reviewer Decision Form

Triggered from the detail screen when status is `Under Review`.

Fields:
- Decision (Approve / Need More Information / Reject)
- Reviewer comment (required for `Need More Information` or `Rejected`)

---

## Submission Checklist

- [ ] GitHub repository (public or shared link)
- [ ] `README.md` with:
  - How to run the backend
  - How to run the frontend
  - How to run migrations
  - Assumptions made
  - What you would improve with more time
- [ ] (Optional) Screenshots or short walkthrough video

---

## Out of Scope

- Authentication / authorization
- Pagination (nice to have but not required)
- Email notifications
- File attachments
- Multi-reviewer support
