import react from "@vitejs/plugin-react-swc";
import { viteYak } from "next-yak/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // relative asset URLs so the built app works from any path on GitHub Pages
  base: "./",
  // viteYak runs before the react plugin so it sees the untransformed
  // tagged template literals
  plugins: [viteYak(), react()],
});
