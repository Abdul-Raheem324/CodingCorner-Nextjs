import path from 'path';
import { NextConfig } from 'next';
import { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack(config: Configuration) {
    if (config.resolve) {
      config.resolve.alias = config.resolve.alias || {}; 
      (config.resolve.alias as { [key: string]: string })['@'] = path.resolve(__dirname, 'src');
    }
    return config;
  },
};

export default nextConfig;
