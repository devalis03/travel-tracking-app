import Link from "next/link"
import { AuthForm } from "@/components/auth/auth-form"

export default function AuthPage() {
  return (
    <div className="flex h-full flex-col justify-center overflow-y-auto px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="font-serif text-3xl text-accent">
          Wayfarer
        </Link>
        <h1 className="mt-8 font-serif text-2xl">Your map of the world</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create an account to keep your travel journal available across devices.
        </p>
        <div className="mt-8">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
