import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
    ],
    server: {
      port: parseInt(env.VITE_PORT || '5173', 10), // Use VITE_PORT or default to 5173
      host: '0.0.0.0', // Allow external connections
    },
  };
});