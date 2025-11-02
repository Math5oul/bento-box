import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['gatherable-unasking-niels.ngrok-free.dev', 'localhost', '127.0.0.1', '0.0.0.0'],
  },
});
