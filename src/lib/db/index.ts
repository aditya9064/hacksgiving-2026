import { memoryStore } from "./memory";
import { makeSupabaseStore } from "./supabase";
import type { Store } from "./store";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

/** Supabase when configured, otherwise an in-memory seeded store so the app runs with zero setup. */
export const db: Store = url && key ? makeSupabaseStore(url, key) : memoryStore;
export const storeKind = url && key ? "supabase" : "memory";
export * from "./store";
