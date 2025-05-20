import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    css: {
      devSourcemap: true,
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      host: '0.0.0.0',
    },
  };
});