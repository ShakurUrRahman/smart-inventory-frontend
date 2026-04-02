import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-[#0a0d12] flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				{/* Large 404 */}
				<div className="mb-8">
					<h1 className="text-9xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
						404
					</h1>
				</div>

				{/* Message */}
				<h2 className="text-2xl font-bold text-white mb-3">
					Page Not Found
				</h2>
				<p className="text-zinc-400 mb-8">
					The page you're looking for doesn't exist or has been moved.
				</p>

				{/* Button */}
				<Link href="/dashboard">
					<Button className="bg-indigo-600 hover:bg-indigo-500 gap-2">
						Go to Dashboard
					</Button>
				</Link>
			</div>
		</div>
	);
}
