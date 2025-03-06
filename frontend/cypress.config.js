// cypress.config.js o cypress.config.mjs
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5174", // <-- Aquí va baseUrl
    setupNodeEvents(on, config) {
      // implement node event listeners here, si los necesitas
    },
  },
});
