import type { MetadataRoute } from "next";

// Web app manifest (Next.js file convention -> served at /manifest.webmanifest and
// auto-linked from <head>). Without it, "Add to Home Screen" on Android/Chrome
// produces an unbranded generic shortcut; with it, users who pin the dashboard get
// a named, branded, standalone entry. Icon and colors reuse the existing brand
// assets: app/icon.svg and the --primary token (#2563eb).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unified CRM/ERP Platform",
    short_name: "CRM/ERP",
    description:
      "Multi-tenant CRM and ERP platform with comprehensive business management tools",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
