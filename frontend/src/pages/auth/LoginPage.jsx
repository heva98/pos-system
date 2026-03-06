import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Store, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ username, password }) => {
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-3">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              {...register('username', { required: 'Username is required' })}
              className="input"
              placeholder="Enter your username"
              autoFocus
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Default: admin / admin123
        </p>
      </div>
    </div>
  )
}