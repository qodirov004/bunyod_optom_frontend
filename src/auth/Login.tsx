'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, Input, Button, Alert } from 'antd'
import { BankOutlined, UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useLoginMutation } from './authApi'
import { useDispatch } from 'react-redux'
import { setUser } from './authSlice'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { removeToken } from './authUtils'
import './style.css'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type LoginCredentials = z.infer<typeof loginSchema>

export function Login() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Clear any existing tokens on login page load
  useEffect(() => {
    removeToken();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (formData: LoginCredentials) => {
    // Reset error state
    setErrorMessage(null);
    
    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
      }).unwrap();

      if (!result?.user?.status) {
        throw new Error('Invalid user data received');
      }

      // Store token in localStorage with a longer expiry time
      localStorage.setItem('token', result.token);
      
      // Calculate expiry time - 24 hours from now for even longer session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Set to 24 hours for extended session
      
      // Store expiry time separately
      localStorage.setItem('token_expires', expiresAt.getTime().toString());
      
      // Set cookie with extended expiry (using max-age for better browser support)
      // 86400 seconds = 24 hours
      document.cookie = `auth-token=${result.token}; path=/; max-age=86400; SameSite=Lax`;
      
      // Save user data to Redux store
      dispatch(setUser(result));

      // Redirect based on user role
      switch (result.user.status) {
        case 'bugalter':
          router.push('/modules/accounting');
          break;
        case 'driver':
          router.push('/modules/driver');
          break;
        case 'ceo':
          router.push('/modules/ceo');
          break;
        case 'owner':
          router.push('/modules/owner');
          break;
        case 'cashier':
          router.push('/modules/cashier');
          break;
        case 'zaphos':
          router.push('/modules/zaphos');
          break;
        default:
          setErrorMessage('Access denied: Unknown user role');
      }
    } catch (error: any) {
      // Next dev overlay `console.error` ni "xato" sifatida ko‘rsatib yuborishi mumkin,
      // shuning uchun bu yerda `console.log` dan foydalanamiz.
      console.log('Login Error:', error);

      const status = error?.status ?? error?.originalStatus;
      const detail = error?.data?.detail ?? error?.data?.message;
      const code = error?.data?.code;

      // Server xabar bergan bo‘lsa
      if (detail) {
        setErrorMessage(`Xatolik: ${detail}`);
        return;
      }

      if (code === 'token_not_valid') {
        setErrorMessage('Token muddati tugagan. Iltimos qaytadan login qiling.');
        removeToken();
        return;
      }

      if (status === 401) {
        setErrorMessage('Login yoki parol noto\'g\'ri. Iltimos qaytadan urinib ko\'ring.');
        return;
      }

      // Network error - server is unreachable
      if (status === 'FETCH_ERROR' || error?.error === 'FETCH_ERROR') {
        setErrorMessage('Backend serverga ulanib bo\'lmadi (http://127.0.0.1:8000/). Server ishlamayotgan bo\'lishi mumkin.');
        return;
      }

      setErrorMessage('Login jarayonida xatolik yuz berdi.');
    }
  };

  return (
    <div className="login-page-bg">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="login-container"
      >
        <div className="login-form-wrapper">
          <div className="form-header-line"></div>
          <div className="login-form">
            <div className="login-logo-container">
              <div className="login-logo-icon">
                <BankOutlined />
              </div>
              <h1>RBL LOGISTCS</h1>
              <p>Xush kelibsiz! Iltimos, tizimga kiring.</p>
            </div>
            
            {errorMessage && (
              <Alert
                message="Xatolik"
                description={errorMessage}
                type="error"
                showIcon
                style={{ marginBottom: 24, borderRadius: 8 }}
                closable
              />
            )}
            
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical" className="custom-login-form">
              <Form.Item
                validateStatus={errors.username ? 'error' : ''}
                help={errors.username?.message}
              >
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      placeholder="admin" 
                      prefix={<UserOutlined className="input-icon" />}
                      className="custom-input" 
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                validateStatus={errors.password ? 'error' : ''}
                help={errors.password?.message}
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password 
                      {...field} 
                      placeholder="•••••" 
                      prefix={<LockOutlined className="input-icon" />}
                      className="custom-input" 
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading} 
                  className="custom-submit-button"
                  size="large"
                  block
                >
                  Kirish <ArrowRightOutlined className="submit-icon" />
                </Button>
              </Form.Item>
              
              <div className="login-footer">
                <p>&copy; 2024 RBL LOGISTCS</p>
              </div>
            </Form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
