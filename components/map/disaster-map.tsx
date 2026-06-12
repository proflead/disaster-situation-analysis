"use client";

import dynamic from "next/dynamic";
import type { MapFeature } from "@/lib/types/disaster";

const DisasterMapInner = dynamic(() => import("./disaster-map-inner"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[460px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">Loading map</div>
});

export function DisasterMap({ features }: { features: MapFeature[] }) {
  return <DisasterMapInner features={features} />;
}
