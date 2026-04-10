type AuthPageProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-auth-background px-4 py-6 sm:py-8 md:py-12">
      <main className="flex w-full max-w-2xl flex-col items-center">
        <div className="w-full max-w-[600px] rounded-2xl border border-border bg-card px-6 py-8 shadow-[0_5px_14px_rgba(0,0,0,0.12)] sm:px-8 sm:py-10">
          {title ? (
            <h1 className="text-center text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mt-1 text-center text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
