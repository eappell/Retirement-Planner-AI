import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration is optimized for Vercel deployment.
export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    // Vite requires the 'VITE_' prefix for environment variables to be exposed to the client.
    // This line reads the VITE_GEMINI_API_KEY from Vercel's build environment (and your local .env file)
    // and makes it available in the application code as 'process.env.API_KEY'.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  },
  resolve: {
  }
  ,
  server: {
    // Forward client-side `/api` calls to the local AI proxy during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
