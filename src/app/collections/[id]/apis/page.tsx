import React from "react";
import { CollectionApisView } from "@/components/collections/CollectionApisView";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return <CollectionApisView collectionId={params.id} />;
}
