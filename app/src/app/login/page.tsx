"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-gold tracking-wide">The Collection</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to access your collection</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-navy-light border border-gold/20 rounded-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-900/40 border border-red-700/40 text-red-300 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@collection.local"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-navy font-semibold py-2.5 rounded-md text-sm transition-colors mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
