import { Suspense } from "react";
import RouteClient from "./RouteClient";

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RouteClient id={id} />;
}

export default function RoutePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <Resolved params={params} />
    </Suspense>
  );
}
