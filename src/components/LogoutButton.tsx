"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  return (
    <button onClick={logout} style={{
      background: "none", border: "1px solid #C0392B", borderRadius: "4px",
      color: "#C0392B", fontSize: "13px", padding: "4px 12px", cursor: "pointer",
    }}>
      Logout
    </button>
  );
}