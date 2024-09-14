/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx}"],
    mode: "jit",
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#050816",
                secondary: "#aaa6c3",
                tertiary: "#151030",
                "black-100": "#100d25",
                "black-200": "#090325",
                "white-100": "#f3f3f3",
                lightPrimary: "#ffffff",  // 白天模式主色
                lightSecondary: "#f3f3f3", // 白天模式辅助色
                lightTertiary: "#e5e5e5",  // 白天模式第三种颜色
            },
            boxShadow: {
                card: "0px 35px 120px -15px #211e35",
            },
            screens: {
                xs: "450px",
            },
            backgroundImage: {
                "hero-pattern-dark": "url('/src/assets/herobg.png')",
                "hero-pattern-light": "url('/src/assets/herobg-light.png')",
            },
        },
    },
    plugins: [],
};