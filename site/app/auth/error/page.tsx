import Link from "next/link";

export default function AuthError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center">
      <h1 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">
        Sign-in failed
      </h1>
      <p className="font-[family-name:var(--font-jakarta)] text-gray-400">
        Something went wrong during sign-in. Please try again.
      </p>
      <Link
        href="/"
        className="font-[family-name:var(--font-jakarta)] mt-2 text-sm text-white hover:text-gray-300 transition-colors duration-200"
      >
        Back to home
      </Link>
    </main>
  );
}
