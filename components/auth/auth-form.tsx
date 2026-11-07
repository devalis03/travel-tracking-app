"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Camera, Check, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client"

type AuthMode = "sign-in" | "sign-up"

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read the selected image."))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error("Could not process the selected image."))
      image.onload = () => {
        const size = 512
        const scale = Math.min(size / image.width, size / image.height, 1)
        const canvas = document.createElement("canvas")
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Could not prepare the selected image."))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.82))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.")
      return
    }
    try {
      setAvatarUrl(await resizeImage(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not use that image.")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const supabase = createSupabaseBrowserClient()
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push("/")
        router.refresh()
        return
      }

      const trimmedFirstName = firstName.trim()
      const trimmedLastName = lastName.trim()
      const trimmedUsername = username.trim().toLowerCase()
      const parsedAge = age ? Number(age) : null
      if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 120)) {
        throw new Error("Age must be a whole number between 13 and 120.")
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            display_name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
            username: trimmedUsername,
            phone: phone.trim(),
            age: parsedAge?.toString() ?? "",
            gender,
            bio: bio.trim(),
            avatar_url: avatarUrl,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast.success("Account created. Check your email to confirm it.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setPending(false)
    }
  }

  async function signInWithGoogle() {
    setPending(true)
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed")
      setPending(false)
    }
  }

  const isSignUp = mode === "sign-up"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSignUp && (
        <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card/60 p-4">
          <div>
            <p className="font-serif text-lg">Create your traveler profile</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A few details help make your journal feel like yours. Optional fields can be completed later.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile preview" className="size-full object-cover" />
              ) : (
                <UserRound className="size-6" />
              )}
            </div>
            <div>
              <Label htmlFor="auth-avatar" className="inline-flex cursor-pointer items-center gap-2 text-sm text-accent">
                <Camera className="size-4" />
                Add profile photo
              </Label>
              <Input id="auth-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              <p className="mt-1 text-xs text-muted-foreground">Optional, up to 512px</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-first-name">First name</Label>
              <Input id="auth-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-last-name">Last name</Label>
              <Input id="auth-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-username">Username</Label>
            <Input id="auth-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_-]+" required />
            <p className="text-xs text-muted-foreground">3-30 letters, numbers, underscores, or hyphens.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="auth-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-age">Age <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="auth-age" type="number" min={13} max={120} value={age} onChange={(event) => setAge(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-gender">Gender <span className="text-muted-foreground">(optional)</span></Label>
            <select id="auth-gender" value={gender} onChange={(event) => setGender(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="self-describe">Self-describe</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-bio">Short description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="auth-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} placeholder="Tell fellow travelers a little about you" rows={3} />
          </div>
        </div>
      )}

      {isSignUp ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/60 p-4">
          <div>
            <p className="font-serif text-lg">Account details</p>
            <p className="mt-1 text-xs text-muted-foreground">Use these details to access your travel journal.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Create my account"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Check className="size-3.5 text-accent" /> You can change these details later in your profile.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={6} required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </>
      )}
      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 border-t border-border" />
        <span className="relative bg-background px-2 text-xs text-muted-foreground">or</span>
      </div>
      <Button type="button" variant="outline" onClick={signInWithGoogle} disabled={pending}>Continue with Google</Button>
      <button type="button" onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {isSignUp ? "Already have an account? Sign in" : "New to Wayfarer? Create an account"}
      </button>
    </form>
  )
}
