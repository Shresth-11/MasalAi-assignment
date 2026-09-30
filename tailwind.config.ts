import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          subtle: "var(--surface-subtle)",
          hover: "var(--surface-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        // Semantic lead status colors
        status: {
          hot: {
            bg: "var(--status-hot-bg)",
            text: "var(--status-hot-text)",
            border: "var(--status-hot-border)",
            dot: "var(--status-hot-dot)",
          },
          warm: {
            bg: "var(--status-warm-bg)",
            text: "var(--status-warm-text)",
            border: "var(--status-warm-border)",
            dot: "var(--status-warm-dot)",
          },
          cold: {
            bg: "var(--status-cold-bg)",
            text: "var(--status-cold-text)",
            border: "var(--status-cold-border)",
            dot: "var(--status-cold-dot)",
          },
          attention: {
            bg: "var(--status-attention-bg)",
            text: "var(--status-attention-text)",
            border: "var(--status-attention-border)",
          },
        },
      },
      fontSize: {
        micro: ["11px", { lineHeight: "14px", letterSpacing: "0.01em" }],
        caption: ["12px", { lineHeight: "16px" }],
        cell: ["13px", { lineHeight: "18px" }],
        body: ["14px", { lineHeight: "20px" }],
        subtitle: ["16px", { lineHeight: "22px", fontWeight: "600" }],
        title: ["20px", { lineHeight: "26px", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        popover: "0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 1px 3px 0 rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
