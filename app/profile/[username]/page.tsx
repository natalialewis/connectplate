import { ProfileCard } from "@/components/profile/ProfileCard";
import { createSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function ({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.rpc("get_profile_card_by_username", {
    p_username: username,
  });
  const row = (data ?? [])[0];
  if (error || !row) {
    notFound();
  }

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="mb-5 text-2xl font-semibold text-foreground sm:text-3xl">Profile</h1>
        <ProfileCard
          profile={{
            id: row.id as string,
            username: row.username as string,
            first_name: row.first_name as string,
            last_name: row.last_name as string,
            avatar_url: (row.avatar_url as string | null) ?? null,
            bio: (row.bio as string | null) ?? null,
            is_self: Boolean(row.is_self),
            already_following: Boolean(row.already_following),
          }}
        />
      </main>
    </div>
  );
}
