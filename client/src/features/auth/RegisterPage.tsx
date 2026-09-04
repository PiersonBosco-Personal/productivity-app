import { Navigate, useNavigate } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { useMe, useRegister } from './queries'

export function RegisterPage() {
  const navigate = useNavigate()
  const me = useMe()
  const register = useRegister()

  if (me.data) return <Navigate to="/" replace />

  return (
    <AuthForm
      mode="register"
      pending={register.isPending}
      error={register.error}
      onSubmit={(values) =>
        register.mutate(values, { onSuccess: () => navigate('/', { replace: true }) })
      }
    />
  )
}
