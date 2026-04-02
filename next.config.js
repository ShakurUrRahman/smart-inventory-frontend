/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	reactStrictMode: true,
	async redirects() {
		return [
			{
				source: "/",
				destination: "/login",
				permanent: false,
			},
		];
	},
	eslint: {
		ignoreDuringBuilds: true, // ← add this
	},
};

module.exports = nextConfig;
