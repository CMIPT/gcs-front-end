// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  runtimeConfig: {
    public: {
      apiBaseURL: "http://3.145.84.42:8080"
    }
  }
})