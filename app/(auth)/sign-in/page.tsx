import { LoginForm } from "@/features/auth/components/login-form";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const logoutReason = cookieStore.get("logout_reason")?.value;
  
  return (
    <LoginForm logoutReason={logoutReason} />
  );
}