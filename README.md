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

   - Copy `.env.example` to `.env`
   - Update the `.env` file with your Supabase credentials

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

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

### Deploying to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/log in
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect it's a Vite project
5. Configure the project settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Add environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_KEY` = your Supabase anon key
7. Click "Deploy" and your app will be live!

### Deploying Using Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Deploy:

   ```bash
   vercel
   ```

3. Follow the prompts to configure your deployment
4. Add environment variables in the Vercel dashboard after deployment

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
