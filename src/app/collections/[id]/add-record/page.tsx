"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AddRecordView } from "@/components/collections/AddRecordView";

export const dynamic = "force-dynamic";

export default function AddRecordPage() {
  const params = useParams();
  const collectionId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  return <AddRecordView collectionId={collectionId} />;
}
