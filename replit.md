# replit.md

## Overview

This is an image processing web application that allows users to upload images and perform operations like resizing, compression, and upscaling. The app features a React frontend with a drag-and-drop interface and an Express backend that uses Sharp for server-side image manipulation. Processed images are temporarily stored on the server with automatic cleanup.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for smooth transitions
- **File Handling**: react-dropzone for drag-and-drop uploads
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express 5 (ESM modules)
- **Image Processing**: Sharp library for resize, compress, and upscale operations
- **File Upload**: Multer middleware for multipart/form-data handling
- **Temporary Storage**: Local `uploads/` directory with automatic cleanup (files older than 1 hour removed every 15 minutes)

### Project Structure
```
client/           # Frontend React application
  src/
    components/   # UI components and feature components
    pages/        # Route pages (Home, NotFound)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client config
server/           # Backend Express application
  index.ts        # Server entry point
  routes.ts       # API route definitions
  static.ts       # Static file serving for production
  vite.ts         # Vite dev server integration
shared/           # Shared code between client and server
  routes.ts       # API route contracts with Zod schemas
```

### API Design
- **POST `/api/process`**: Accepts multipart/form-data with image file and JSON params for processing
- **GET `/api/download/:filename`**: Serves processed images for download
- Route contracts defined in `shared/routes.ts` using Zod for type safety

### Development vs Production
- **Development**: Vite dev server with HMR, integrated with Express
- **Production**: Client built to `dist/public`, server bundled with esbuild to `dist/index.cjs`

## External Dependencies

### Image Processing
- **Sharp**: Server-side image manipulation (resize, compress, format conversion)

### UI Framework
- **Radix UI**: Headless component primitives for accessible UI
- **shadcn/ui**: Pre-styled component library built on Radix

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Database
- **Drizzle ORM**: Database toolkit configured but not actively used (storage interface is empty)
- Database can be added later via `drizzle-kit push` command

### Fonts
- Google Fonts: Outfit (display) and Plus Jakarta Sans (body)