"use client";
import { useEffect, useState } from "react";

export interface Me { name: string; org: string; partnerId?: string }
const DEFAULT: Me = { name: "Marcus T.", org: "ComForce MKE", partnerId: "p-comforce" };

/** Lightweight "who am I" for the demo. Real deployments swap this for Supabase Auth. */
export function useMe(): [Me, (m: Me) => void] {
  const [me, setMe] = useState<Me>(DEFAULT);
  useEffect(() => {
    const s = localStorage.getItem("relay-me");
    if (s) setMe(JSON.parse(s));
  }, []);
  const save = (m: Me) => {
    setMe(m);
    localStorage.setItem("relay-me", JSON.stringify(m));
  };
  return [me, save];
}
