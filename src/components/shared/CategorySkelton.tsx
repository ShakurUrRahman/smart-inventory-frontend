export default function CategoryCardSkeleton() {
	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
			<div className="flex items-start gap-3 mb-4">
				<div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
				<div className="flex-1 pt-1">
					<div className="h-4 w-32 bg-white/10 rounded" />
				</div>
			</div>
			<div className="h-3 w-20 bg-white/10 rounded" />
		</div>
	);
}
