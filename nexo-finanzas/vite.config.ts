import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" => funciona en la raíz del dominio o dentro de una subcarpeta de public_html
export default defineConfig({ plugins: [react()], base: "./" });
