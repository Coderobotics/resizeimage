## Packages
react-dropzone | For drag and drop file uploads
framer-motion | For smooth transitions and animations
lucide-react | For beautiful icons

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
API expects multipart/form-data for uploads at /api/upload
API expects JSON for processing at /api/process/:id
