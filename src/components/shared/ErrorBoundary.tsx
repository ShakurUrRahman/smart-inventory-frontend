"use client";

import React, { ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-[400px] flex items-center justify-center px-4">
					<div className="max-w-md text-center bg-[#13161F] border border-red-500/30 rounded-xl p-6">
						<AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
						<h2 className="text-xl font-semibold text-white mb-2">
							Something went wrong
						</h2>
						<p className="text-zinc-400 text-sm mb-6">
							{this.state.error?.message ||
								"An unexpected error occurred. Please try again."}
						</p>
						<Button
							onClick={this.handleReset}
							className="bg-indigo-600 hover:bg-indigo-500 gap-2"
						>
							<RotateCcw className="w-4 h-4" /> Try Again
						</Button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
