import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        dashboard: './pages/dashboard.html',
        login: './pages/login.html',
        profile: './pages/profile.html',
        share: './pages/share.html',
        verify: './pages/verify.html'
      }
    }
  }
});
