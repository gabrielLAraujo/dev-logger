"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Iniciando login...");
      
      await signIn("github", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? "Entrando..." : "Entrar com GitHub"}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
} 