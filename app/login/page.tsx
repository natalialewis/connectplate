import AuthPage from "@/components/auth/AuthPage";
import { LoginForm } from "./components/LoginForm";

export default function LoginPage() {
  return (
    <AuthPage
      title="Log in"
      description=""
    >
      <LoginForm />
    </AuthPage>
  );
}
