import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const supabaseResponse = NextResponse.next({ request });
    const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


    const supabase = createServerClient(supabaseURL,supabaseAnonKey,{
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    // Get the user's session
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // Public routes: marketing/auth entry, and OAuth PKCE callback (see Supabase Google/OAuth docs).
    const isPublicRoute =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/auth/callback" ||
        pathname === "/auth/auth-code-error";

    // If the user is not on a public route and not authenticated, redirect to '/login'
    if (!isPublicRoute && !user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // OAuth sign-up: session exists but profile is not finished until username + names are saved.
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("signup_completed")
            .eq("id", user.id)
            .maybeSingle();
        if (profile && profile.signup_completed === false) {
            const allowedForIncompleteSignup = [
                "/signup",
                "/login",
                "/auth/callback",
                "/auth/auth-code-error",
            ];
            if (!allowedForIncompleteSignup.includes(pathname)) {
                return NextResponse.redirect(new URL("/signup?finish=1", request.url));
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
      /*
       * Match all request paths except:
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
       * Feel free to modify this pattern to include more paths.
       */
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};