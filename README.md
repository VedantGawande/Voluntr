# Voluntr

Voluntr is a college-level volunteer opportunity platform built with React, Express, Node.js and MongoDB.

## Features

- Volunteer and organization registration and login
- Role-based access enforced by the backend
- Volunteer and organization profile management
- Organization opportunity drafts, publishing, editing, closing and cancellation
- Opportunity search and filters (keyword, category, location, mode, date and skill)
- Volunteer applications, withdrawal, and application status tracking
- Organization applicant review with accept/reject and capacity checks
- In-app notifications
- Basic administrator dashboard, account activation controls and opportunity removal
- Password change using the current password

The project does not depend on external email/SMS, map, payment or cloud file-storage providers. Notifications are in-app only. Admin accounts are created manually by the project team.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas cluster or local MongoDB instance

## Backend setup

1. Open a terminal in the `server` folder.
2. Create a file named `.env` in that folder using `.env.example` as a template.
3. Fill in `MONGO_URI`, `JWT_SECRET` (at least 16 characters), and `CLIENT_URL=http://localhost:3000`.
4. Install packages and start the API:

   ```bash
   npm install
   npm run dev
   ```

The API runs on `http://localhost:5000`. You can check it at `http://localhost:5000/health`. When the server first connects, it also migrates old VolunTree accounts (first name/last name fields) into the new volunteer profile format; those accounts are assigned the volunteer role.

## Frontend setup

Open a second terminal in the `client` folder:

```bash
npm install
npm start
```

The website runs on `http://localhost:3000`.

If the API uses a different address, create `client/.env` and set `REACT_APP_API_URL` to that address.

## Create the administrator account

Set these values in `server/.env`:

```env
ADMIN_NAME=Voluntr Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose_a_password_of_at_least_8_characters
```

Then, from the `server` folder, run this once:

```bash
npm run create-admin
```

This creates the admin account (or promotes the matching existing email to the admin role). There is no public admin registration option.

## MongoDB Atlas note

In MongoDB Atlas, make sure the cluster is running, the database user has read/write access, and your current IP is included under **Security → Network Access**. For local college demonstrations, allow only the required development IP rather than opening access to everyone.

## Main API routes

- `POST /auth/register`, `POST /auth/login`, `PATCH /auth/change-password`
- `/api/profile`, `/api/dashboard`
- `/api/opportunities` and `/api/opportunities/:id` (organization create/edit/publish/close/cancel actions)
- `/api/opportunities/:id/applications` (organization review) and `/api/applications/mine` (volunteer tracking)
- `/api/notifications` (in-app notifications and read status)
- `/api/admin/overview`, `/api/admin/users`, `/api/admin/opportunities/:id`
