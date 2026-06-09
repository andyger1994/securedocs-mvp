"use client";

import { supabase } from "@/lib/supabase";

export async function isAuthenticated() {
  if (!supabase) return false;
  const { data, error } = await supabase.auth.getSession();
  return !error && Boolean(data.session);
}

export async function login(email: string, password: string) {
  if (!supabase) {
    return { success: false, message: "Supabase no esta configurado." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: "Correo o contrasena incorrectos." };
  }

  return { success: true, message: "" };
}

export async function logout() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
