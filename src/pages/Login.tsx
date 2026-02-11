import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'react-toastify';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    toast.dismiss(); // Clear any existing toasts

    const response = await authApi.login({
      email: data.email,
      password: data.password,
    });

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    if (response.data) {
      login(response.data.token, response.data.user);
      toast.success(`Welcome back ${response.data.user.name}!`);
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <div className="cat-auth-bg relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <img
        src="/paws.png"
        alt=""
        className="paw-float pointer-events-none absolute left-6 top-10 h-12 w-12"
      />
      <img
        src="/paws.png"
        alt=""
        className="paw-float-reverse pointer-events-none absolute bottom-14 right-7 h-14 w-14"
      />
      <img
        src="/paws.png"
        alt=""
        className="paw-float pointer-events-none absolute left-1/2 top-1/3 h-10 w-10 -translate-x-1/2 opacity-10"
      />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm items-center">
        <div className="w-full space-y-7 rounded-2xl border border-border/80 bg-card/90 p-6 shadow-lg backdrop-blur-sm">
          <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-serif text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              Meowwdium
              <img
                src="/paws.png"
                alt="Meowwdium"
                className="paw-wiggle inline-block h-8 w-8 align-middle"
              />
            </h1>
          </Link>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Welcome back, hooman</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in and continue your purr-sonal blogging journey.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/90">
            Funny rule: no laser-pointer passwords allowed.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
