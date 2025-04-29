# Fresh Home Radar

A modern real estate application built with React, TypeScript, and Python that helps users discover, filter, and explore property listings.

## Project Overview

Fresh Home Radar is a full-stack application featuring:
- Frontend: React with TypeScript, shadcn-ui components, and Tailwind CSS
- Backend: Python FastAPI server

The application allows users to search for properties, filter by various criteria, view detailed listings, and save favorites.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- shadcn-ui components
- Tailwind CSS
- React Router
- React Query

### Backend
- Python
- FastAPI
- PyTorch
- Transformers

## Getting Started

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Python 3.8+ - [download from python.org](https://www.python.org/downloads/)

### Installation

1. Clone the repository
```sh
git clone <repository-url>
cd fresh-home-radar
```

2. Install frontend dependencies
```sh
npm install
```

3. Install backend dependencies
```sh
pip install -r backend/requirements.txt
```

### Running the Application

#### Development Mode

Start the frontend development server:
```sh
npm run dev
```

Start the backend server:
```sh
npm run dev:server
```

Or run both concurrently:
```sh
npm run dev:all
```

#### Production Build

Build the frontend for production:
```sh
npm run build
```

Preview the production build:
```sh
npm run preview
```

## Project Structure

```
fresh-home-radar/
├── backend/                 # Python FastAPI backend
│   ├── fastapi_app.py       # Main FastAPI application
│   ├── run_server.py        # Server startup script
│   └── requirements.txt     # Python dependencies
├── public/                  # Static assets
├── src/                     # Frontend source code
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Library code
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Application entry point
└── ...                      # Configuration files
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
