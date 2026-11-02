import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function AuthConfirmedPage() {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm text-center">
        <p className="font-serif text-3xl text-accent">Wayfarer</p>
        <h1 className="mt-8 font-serif text-2xl">Your email is confirmed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your account has been created successfully. You can now return to Wayfarer and sign in.
        </p>
        <Link href="/auth" className={`${buttonVariants()} mt-8 w-full`}>
          Continue to sign in
        </Link>
      </div>
    </div>
  )
}
