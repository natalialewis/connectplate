import { SignupForm } from "./components/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-auth-background px-4 py-6 sm:py-8 md:py-12">
      <main className="flex w-full max-w-2xl flex-col items-center">
        <SignupForm />
      </main>
    </div>
  );
}
