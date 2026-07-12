# TransitOps — Frontend

React + Vite + TypeScript frontend for the TransitOps Smart Transport Operations Platform.

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (custom design system)
- **State**: Zustand
- **Routing**: React Router v6
- **HTTP**: Axios
- **Charts**: Recharts

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Structure

```
src/
├── api/          # Axios API calls per module
├── components/   # Reusable UI components
├── pages/        # Route-level page components
├── router/       # React Router config
└── store/        # Zustand state stores
```
