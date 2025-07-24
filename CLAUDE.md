# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Installation
- `npm run install:all` - Install dependencies for both server and client
- `npm install` - Install server dependencies only
- `cd client && npm install` - Install client dependencies only
- `npm run check-keys` - Verify AI API key configuration

### Development
- `npm run dev` - Start both frontend (port 3000) and backend (port 3001) in development mode
- `npm run server:dev` - Start backend server only with nodemon
- `npm run client:dev` - Start frontend client only with Vite

### Production
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint on server code
- `npm run test` - Run Jest tests
- `npm run typecheck` - No TypeScript files to check (placeholder)

## Architecture Overview

### Full-Stack Application Structure
This is a monorepo containing both backend (Node.js/Express) and frontend (React/Vite) applications for AI-powered PDF data extraction.

**Core Workflow:**
1. User selects PDF source (local folder or Box.com)
2. User configures extraction fields with AI prompts
3. Backend processes PDFs and extracts data using AI models
4. Frontend displays results in interactive table with CSV export

### Backend Architecture (`server/`)

**Main Components:**
- `server/index.js` - Express server with middleware, CORS, rate limiting
- `server/routes/` - API endpoints organized by functionality
- `server/services/` - Business logic services

**Key Services:**
- `aiExtractor.js` - AI integration (Claude 3.5 Sonnet primary, GPT-4 fallback)
- `pdfProcessor.js` - PDF parsing and text extraction using pdf-parse
- `folderReader.js` - Local filesystem and Box.com API integration

**API Structure:**
- `/api/folders/*` - Folder browsing and PDF discovery
- `/api/pdf/*` - PDF processing and validation
- `/api/extraction/*` - AI-powered data extraction and CSV export

### Frontend Architecture (`client/`)

**React Application with:**
- Vite for fast development and building
- Tailwind CSS for styling
- Component-based architecture

**Key Components:**
- `App.jsx` - Main application with 3-step workflow
- `FolderSelector.jsx` - Browse local/Box folders, select PDF source
- `FieldConfiguration.jsx` - Configure extraction fields and AI prompts
- `DataTable.jsx` - Display results with search, sort, filter, CSV export

**Services:**
- `services/api.js` - Axios-based API client with error handling

### AI Integration

**Cascading Model Selection Strategy:**
1. Primary: Claude 3.5 Sonnet (Anthropic) - optimized for document analysis
2. Secondary: GPT-4 Turbo (OpenAI) - versatile language model fallback
3. Tertiary: Google Gemini 1.5 Pro - advanced multimodal AI fallback
4. Final: OCR with Tesseract.js - optical character recognition for image-based PDFs

**Extraction Process:**
- Attempts text extraction using pdf-parse first
- Tries each AI service in priority order until one succeeds
- If all AI services fail, uses OCR to extract text from PDF images
- OCR includes pattern matching for common field types (dates, amounts, emails)
- Batch processing with rate limiting and comprehensive error handling

### Box.com Integration

**SDK Integration:**
- Uses official node-box-sdk
- Supports folder browsing and file download
- Requires client ID, secret, and access token
- Gracefully handles missing configuration

## AI API Configuration

**IMPORTANT**: The system works with multiple AI providers and includes OCR fallback. For best results, configure at least one AI API key.

### Supported AI Services:
1. **Anthropic Claude** (recommended): https://console.anthropic.com/
2. **OpenAI GPT-4**: https://platform.openai.com/api-keys  
3. **Google Gemini**: https://makersuite.google.com/app/apikey
4. **OCR Fallback**: Always available (no API key required)

### Setup (choose one or more):
```bash
# Primary (recommended)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Secondary fallback
OPENAI_API_KEY=sk-your-key-here

# Tertiary fallback  
GOOGLE_GEMINI_API_KEY=your-google-key-here
```

### Verify Configuration:
```bash
npm run check-keys
```

### Fallback Behavior:
- **With AI keys**: Claude → OpenAI → Google → OCR
- **No AI keys**: OCR-only extraction with pattern matching
- **Partial failures**: Automatically tries next available service

### Troubleshooting:
- Authentication errors indicate invalid API keys
- OCR fallback works even without AI API keys
- See `API_KEY_SETUP.md` for detailed instructions

## Important Implementation Details

### Error Handling
- Comprehensive error handling at API level
- Toast notifications for user feedback
- Graceful degradation when services unavailable
- File cleanup after processing

### Security Features
- Rate limiting with rate-limiter-flexible
- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- Temporary file cleanup

### Performance Optimizations
- Streaming for large file downloads
- Batch processing for multiple PDFs
- Frontend virtualization for large datasets
- API response caching where appropriate

### Configuration Management
- Environment variables in .env file
- Separate development/production configs
- Configurable field templates (Invoice, Contract, Receipt)
- Dynamic AI model selection based on availability

## Development Patterns

### Adding New Extraction Fields
1. Update field configuration in frontend
2. Add field validation in backend
3. Update AI prompts to include new field descriptions
4. Test with sample documents

### Adding New PDF Sources
1. Extend `folderReader.js` service
2. Add new API routes in `folders.js`
3. Update frontend `FolderSelector.jsx`
4. Add appropriate error handling

### Extending AI Capabilities
1. Add new AI provider in `aiExtractor.js`
2. Implement provider-specific prompt formatting
3. Add model selection logic
4. Update configuration and documentation

## Common Maintenance Tasks

### Updating Dependencies
- Use `npm run install:all` after pulling changes
- Check for security vulnerabilities with `npm audit`
- Update AI model versions in service configurations

### Monitoring and Debugging
- Check server logs for API errors
- Monitor AI API usage and rate limits
- Verify PDF processing success rates
- Review client-side error reporting

### Database Integration (Future)
Currently file-based with in-memory processing. For database integration:
- Add database service layer
- Implement data persistence for extraction results
- Add user management and session handling
- Consider job queue for long-running extractions

## Contributing
Use .env files with a library like dotenv in Node.js or Python to keep secrets outside your source code.

