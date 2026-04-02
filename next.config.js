/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true, // ← add this
	},
};

module.exports = nextConfig;
