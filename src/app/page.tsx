"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOlio } from "@/state/OlioProvider";

export default function Home() {
  const router = useRouter();
  const { auth } = useOlio();

  useEffect(() => {
    if (auth.isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [auth.isLoggedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-xl bg-brand-500 animate-spin"></div>
    </div>
  );
}
