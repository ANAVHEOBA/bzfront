import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '25dc9239da2e.ngrok-free.app' // Your ngrok domain
    ]
  }
}); 