// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    'arco-design-nuxt-module'
  ],
  runtimeConfig: {
    public: {
      apiBaseURL: "http://150.158.12.130:8080"
    }
  }
})