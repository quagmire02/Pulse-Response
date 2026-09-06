export default function sitemap() {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const now = new Date();

  return [
    { url: `${base}/welcome`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
