"use client";

import dynamic from "next/dynamic";

const BerlinDecisionMap = dynamic(() => import("@/components/BerlinDecisionMap"), {
  ssr: false,
});

export default function ClientMapLoader() {
  return <BerlinDecisionMap />;
}
