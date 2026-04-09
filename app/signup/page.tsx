import AuthPage from "@/components/auth/AuthPage";
import { SignupForm } from "./components/SignupForm";

export default function SignupPage() {
  return (
    <AuthPage
      title="Sign up"
      description=""
    >
      <SignupForm />
    </AuthPage>
  );
}
