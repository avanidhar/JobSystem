import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        // Dev-only container setup: requests can arrive with a Host header
        // matching the docker-compose service name rather than localhost.
        allowedHosts: true,
        watch: {
            usePolling: true,
        },
    },
});
