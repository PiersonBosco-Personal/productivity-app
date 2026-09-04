import { Navigate, useNavigate } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { useLogin, useMe } from './queries'

export function LoginPage() {
  const navigate = useNavigate()
  const me = useMe()
  const login = useLogin()

  if (me.data) return <Navigate to="/" replace />

  return (
    <AuthForm
      mode="login"
      pending={login.isPending}
      error={login.error}
      onSubmit={({ email, password }) =>
        login.mutate({ email, password }, { onSuccess: () => navigate('/', { replace: true }) })
      }
    />
  )
}
