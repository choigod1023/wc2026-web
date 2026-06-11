import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 상위 폴더의 다른 lockfile 때문에 워크스페이스 루트가 오인되는 것 방지
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
