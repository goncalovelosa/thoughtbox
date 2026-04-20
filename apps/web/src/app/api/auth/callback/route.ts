import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — handles OAuth code exchange and PKCE email confirmations.
 * After a successful exchange the user is redirected to `next` (default: /w/demo/dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth
      .exchangeCodeForSession(code);
    if (!error && user) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("workspaces!profiles_default_workspace_id_fkey(slug)")
        .eq("user_id", user.id)
        .single();

      const ws = profile?.workspaces as unknown as { slug: string } | null;
      if (ws?.slug) {
        return NextResponse.redirect(`${origin}/w/${ws.slug}/dashboard`);
      }

      return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
