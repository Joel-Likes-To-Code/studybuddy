// app/(auth)/actions.ts
"use server";

import { signIn, signOut } from "@/auth";

/**
 * Sign the user in and redirect to the dashboard.
 */
export async function signInAction() {
  await signIn("", { redirectTo: "/dashboard" });
}

/**
 * Sign the user out and redirect to the homepage.
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
