// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "arco-design-nuxt-module",
  ],
  routeRules: {
    "/api/gcs/**": {
      proxy: "http://localhost:8080/api/**",
    },
  },
});
