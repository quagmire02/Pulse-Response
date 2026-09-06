export default function robots() {
  const base = process.env.SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",

      disallow: ["/api/", "/admin-dashboard/", "/profile/", "/history/", "/orders/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
