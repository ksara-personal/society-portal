"use client";

import { useEffect, useState } from "react";
import { getWings, getFlatsForWing } from "@/actions/flats";

/** Fetches the distinct wing names from the Flat master, once on mount. */
export function useWings() {
  const [wings, setWings] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    getWings().then((data) => {
      if (active) setWings(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return wings;
}

/** Fetches padded flat/villa numbers for the given wing, refetching whenever it changes. */
export function useFlatsForWing(wing: string | undefined, options?: { eligibleOnly?: boolean }) {
  const [flats, setFlats] = useState<string[]>([]);
  const eligibleOnly = options?.eligibleOnly ?? false;

  useEffect(() => {
    let active = true;
    getFlatsForWing(wing, { eligibleOnly }).then((data) => {
      if (active) setFlats(data);
    });
    return () => {
      active = false;
    };
  }, [wing, eligibleOnly]);

  return flats;
}
