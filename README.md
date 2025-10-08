
# Book Hive 

Book Hive is a modern, full-featured online library management system built for seamless book lending, inventory management, and user engagement. Designed for both administrators and clients, it provides a beautiful, responsive interface and powerful tools for managing a digital library.

## Features

- **Admin Dashboard:** Manage books, copies, requests, loans, and overdue items with real-time stats and activity tracking.
- **Client Portal:** Search, borrow, and track books with an intuitive interface and instant notifications.
- **Book Management:** Add, edit, and remove books and copies, with category tagging and cover uploads.
- **Borrow Requests:** Automated approval/rejection workflows, overdue checks, and email notifications.
- **Analytics:** Animated counters, loan trends chart, and library statistics for actionable insights.
- **Role Selection:** Secure login and role-based access for admins and clients.
- **Responsive UI:** Built with shadcn-ui and Tailwind CSS for a fast, accessible experience on any device.

## Tech Stack

- [Vite](https://vitejs.dev/) – Lightning-fast build tool
- [React](https://react.dev/) – UI library
- [TypeScript](https://www.typescriptlang.org/) – Type-safe development
- [shadcn-ui](https://ui.shadcn.com/) – Modern UI components
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Supabase](https://supabase.com/) – Backend, authentication, and database

## Getting Started

Clone the repository and install dependencies:

```sh
git clone https://github.com/EmmahOwens/book-hive.git
cd book-hive256
npm i
```

Start the development server:

```sh
npm run dev
```

## Project Structure

- `src/` – Main source code
	- `components/` – Reusable UI components
	- `pages/` – Application pages (Admin, Client, Book Details, etc.)
	- `hooks/` – Custom React hooks
	- `lib/` – Utility functions
	- `integrations/supabase/` – Supabase integration
- `public/` – Static assets and uploads
- `supabase/` – Supabase functions and migrations

## Supabase Setup

Configure your Supabase project and update environment variables as needed. See `supabase/config.toml` for details.
