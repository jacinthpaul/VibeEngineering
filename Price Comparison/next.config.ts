import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the app can be hosted on GitHub Pages. The search
  // engine runs fully client-side, so no server is needed.
  output: "export",
  // Set by CI when deploying to a project-pages URL like
  // https://<user>.github.io/<repo>/.
  basePath: process.env.PAGES_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default nextConfig;
