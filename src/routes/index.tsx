import { createFileRoute } from "@tanstack/react-router";
import { MainMap } from "#/components/maps/main-map.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
			<MainMap />
		</div>
	);
}
