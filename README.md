# Weekly Wins - Team Productivity App

A Next.js 14 application for tracking weekly achievements and team progress, built with Supabase backend and mobile-first responsive design.

## Features

- 📝 **Weekly Entry Form** - Submit wins, learnings, and challenges
- 👥 **Community Board** - View team progress and achievements
- 🎨 **Dark/Light Theme** - System preference with manual toggle
- 📱 **Mobile Responsive** - Touch-friendly interface across all devices
- 🔐 **Authentication** - Secure login with Supabase Auth
- 💾 **Auto-save** - Drafts saved automatically while typing
- 🔍 **Search & Filter** - Find entries by date, user, or content
- 👤 **User Profiles** - Individual progress tracking

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom theme system
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd weekly-wins
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase-schema.sql` to create tables and policies

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## Database Schema

The app uses two main tables:

- **profiles** - Extended user information
- **weekly_entries** - Weekly submissions with wins, learnings, challenges

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── community/         # Community board
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── community/        # Community board components
│   ├── layout/           # Layout components
│   ├── theme/            # Theme system
│   └── weekly-entry/     # Weekly entry form
├── lib/                  # Utilities and configuration
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client and types
│   └── utils/            # Utility functions
└── globals.css           # Global styles and theme
```

## Key Features

### Mobile-First Responsive Design

- Touch-friendly 44px minimum touch targets
- Collapsible sections on mobile
- Adaptive navigation (drawer on mobile, sidebar on desktop)
- Safe area support for iOS devices

### Theme System

- CSS variables for consistent theming
- Light/dark mode with system preference detection
- Semantic color system that adapts to themes
- Smooth transitions without layout shift

### Authentication Flow

- Email/password authentication via Supabase
- Protected routes with AuthGuard component
- Automatic profile creation on signup
- Session management with auto-refresh

### Weekly Entry Form

- Auto-save drafts every 30 seconds
- Mobile-responsive collapsible sections
- Form validation and error handling
- Publish/draft status management

### Community Board

- Real-time updates from Supabase
- Search and filter functionality
- Infinite scroll with pagination
- Grid/list view toggle (desktop)

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Other Platforms

The app is a standard Next.js application and can be deployed on:
- Netlify
- Railway
- AWS Amplify
- Any Node.js hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile and desktop
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Copyright

© 2024 Weekly Wins - Built with ❤️ by [Atharva Wankhede](https://github.com/aths7)

## Support

For issues and questions:
- Check the Issues tab
- Review the database schema in `supabase-schema.sql`
- Verify environment variables are set correctly