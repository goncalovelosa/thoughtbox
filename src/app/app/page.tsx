import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspaces!profiles_default_workspace_id_fkey(slug)")
    .eq("user_id", user.id)
    .single();

  const ws = profile?.workspaces as unknown as { slug: string } | null;
  if (ws?.slug) redirect(`/w/${ws.slug}/dashboard`);

  redirect("/sign-in");
}
