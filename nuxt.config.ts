// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: false },

  modules: ["@nuxt/ui", "@nuxt/eslint"],

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "Regenbogen",
      meta: [
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: "Regenbogen" },
        { name: "theme-color", content: "#ffffff" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Sour+Gummy:wght@400;600;700&display=swap",
        },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ["animejs"],
    },
  },

  colorMode: {
    preference: "dark",
  },

  compatibilityDate: "2025-07-16",
});
