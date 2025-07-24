# PDF Data Extractor

An AI-powered application that reads PDF files from local and Box.com folders, extracts structured data using advanced AI models, and presents the information in a user-friendly interface with CSV export capabilities.

## Features

- **Multi-source PDF Processing**: Read PDFs from local folders and Box.com
- **AI-Powered Data Extraction**: Uses Claude 3.5 Sonnet (Anthropic) and GPT-4 (OpenAI) for intelligent data extraction
- **Customizable Field Mapping**: Configure which data fields to extract from your documents
- **Interactive Data Table**: View, search, filter, and sort extracted data
- **CSV Export**: Download extracted data in CSV format
- **Responsive UI**: Modern React interface with Tailwind CSS
- **Error Handling**: Robust error handling and user feedback

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PDF Processing**: pdf-parse for text extraction
- **AI Integration**: OpenAI GPT-4 and Anthropic Claude APIs
- **Box.com Integration**: Official Box SDK
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **React** with Vite for fast development
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Table** for data display
- **React Dropzone** for file uploads
- **Lucide React** for icons

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- API keys for OpenAI and/or Anthropic
- Box.com API credentials (optional)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-data-extractor
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # AI API Keys (at least one required)
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Box.com API Configuration (optional)
   BOX_CLIENT_ID=your_box_client_id
   BOX_CLIENT_SECRET=your_box_client_secret
   BOX_ACCESS_TOKEN=your_box_access_token
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```
   
   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

### 1. Select PDF Source
- Choose between local folders or Box.com folders
- Browse and select the folder containing your PDF files

### 2. Configure Extraction Fields
- Use preset templates (Invoice, Contract, Receipt) or create custom fields
- Specify field names, display names, and descriptions for AI extraction
- Add or remove fields as needed

### 3. Process and View Results
- Start the AI extraction process
- View results in an interactive data table
- Search, filter, and sort extracted data
- Export results to CSV format

## API Endpoints

### Folders
- `GET /api/folders/available` - Get available local and Box folders
- `POST /api/folders/local/pdfs` - Get PDF files from local folder
- `POST /api/folders/box/pdfs` - Get PDF files from Box folder

### PDF Processing
- `POST /api/pdf/process` - Process single PDF file
- `POST /api/pdf/process-batch` - Process multiple PDF files
- `POST /api/pdf/info` - Get PDF file information

### Data Extraction
- `POST /api/extraction/extract-local` - Extract data from local folder
- `POST /api/extraction/extract-box` - Extract data from Box folder
- `POST /api/extraction/export-csv` - Export results to CSV
- `GET /api/extraction/models` - Get available AI models

## Configuration

### Field Configuration
Fields can be customized with:
- **name**: Internal field identifier
- **displayName**: Human-readable field name
- **description**: Instructions for AI extraction

### AI Model Selection
The application automatically selects the best available AI model:
1. Claude 3.5 Sonnet (Anthropic) - Primary choice for document analysis
2. GPT-4 Turbo (OpenAI) - Fallback option

### Box.com Setup
To enable Box.com integration:
1. Create a Box developer account
2. Create a new Box application
3. Generate client credentials and access token
4. Add credentials to your `.env` file

## Security Features

- Rate limiting to prevent API abuse
- Input validation and sanitization
- Secure file handling with automatic cleanup
- CORS protection
- Helmet.js security headers

## Development

### Project Structure
```
pdf-data-extractor/
├── server/                 # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── index.js           # Server entry point
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service layer
│   │   └── App.jsx        # Main application component
│   └── package.json
├── package.json           # Root package configuration
└── README.md
```

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Adding New Features

1. **Backend Changes**: Add new routes in `server/routes/` and services in `server/services/`
2. **Frontend Changes**: Add components in `client/src/components/` and update API calls in `client/src/services/api.js`
3. **Database**: Currently file-based, can be extended with database integration

## Troubleshooting

### Common Issues

1. **AI API Errors**: Ensure valid API keys in `.env` file
2. **Box.com Connection**: Verify Box API credentials and permissions
3. **PDF Processing Errors**: Check file permissions and PDF validity
4. **Port Conflicts**: Change ports in configuration if 3000/3001 are in use

### Logs
Check server console for detailed error messages and processing status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs for error details
3. Create an issue on the repository