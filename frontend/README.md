# Inventory Management System - Frontend

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## Setup and Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build
- `npm run format`: Format code using Prettier

## Project Structure

- `src/`: Source code
  - `components/`: Reusable React components
  - `pages/`: Page components
  - `services/`: API and data fetching logic
  - `store/`: Redux store and slices
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions

## Styling

This project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`.

## State Management

- Redux Toolkit for global state
- React Query for server state management

## Environment Variables

Create a `.env` file in the root directory for environment-specific configurations.

## Troubleshooting

- Ensure all dependencies are installed correctly
- Check console for any error messages
- Verify Node.js and npm versions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request