import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  mode: 'login' | 'register'
  pending: boolean
  error: Error | null
  onSubmit: (values: { email: string; password: string; displayName: string }) => void
}

export function AuthForm({ mode, pending, error, onSubmit }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const isRegister = mode === 'register'

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isRegister ? 'Create an account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {isRegister ? 'Start organizing your time.' : 'Welcome back.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit({ email, password, displayName })
            }}
          >
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={isRegister ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error.message}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Link className="underline underline-offset-4" to={isRegister ? '/login' : '/register'}>
                {isRegister ? 'Sign in' : 'Create one'}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
