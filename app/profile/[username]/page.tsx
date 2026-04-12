type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="min-h-full bg-background px-4 py-8 sm:py-10 md:py-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Profile</h1>
        <p className="mt-3 text-muted-foreground sm:mt-4 sm:text-lg">
          Public profile for <span className="font-medium text-foreground">@{username}</span> will appear here.
        </p>
      </main>
    </div>
  );
}
