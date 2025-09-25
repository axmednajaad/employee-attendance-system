# Employee Attendance Management System

A modern, responsive web application for managing employee attendance with a beautiful UI built using React, Vite, Tailwind CSS, and Supabase.

## Features

- **Admin Authentication**: Secure login and registration system
- **Employee Management**: Register new employees with auto-generated unique IDs
- **Attendance Tracking**: Monthly grid view for tracking employee attendance
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Attendance changes are saved immediately

## Technologies Used

- React + Vite
- Tailwind CSS
- Supabase (Backend as a Service)
- Lucide React (Icons)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Supabase database:

   - Go to your Supabase project dashboard
   - Copy the SQL statements from `database-schema.sql`
   - Run them in the Supabase SQL editor

4. Configure environment variables:

   - Update the `.env` file with your Supabase credentials

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3001`

## Database Setup

The application requires two tables in your Supabase database:

1. **employees**: Stores employee information
2. **attendance**: Stores attendance records

To create these tables:

1. Copy the SQL statements from `database-schema.sql`
2. Paste them into the Supabase SQL editor
3. Run the queries

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── lib/            # Utility functions
├── assets/         # Static assets
├── App.jsx         # Main application component
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production version
- `npm run preview`: Preview the production build

## Deployment

To deploy the application:

1. Build the production version:

   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your preferred hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
