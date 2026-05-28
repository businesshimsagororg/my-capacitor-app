import React from "react";

export class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="fixed inset-0 flex items-center justify-center bg-black text-white p-6 text-center">
					<div>
						<h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="px-6 py-2 bg-neutral-800 rounded-lg"
						>
							Reload App
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
