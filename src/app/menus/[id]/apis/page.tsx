import React from "react";
import { MenuApisView } from "@/components/menus/MenuApisView";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { id: string } }) {
  return <MenuApisView menuId={params.id} />;
}
