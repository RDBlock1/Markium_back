// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://markiumpro.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://markiumpro.com/about",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://markiumpro.com/new-server-sitemap.xml",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    }
  ];
}
