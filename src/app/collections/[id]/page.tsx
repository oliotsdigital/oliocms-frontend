import React from "react";
import { CollectionDetailView } from "@/components/collections/CollectionDetailView";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return <CollectionDetailView collectionId={params.id} />;
}

