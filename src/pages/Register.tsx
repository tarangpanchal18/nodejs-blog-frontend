import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    toast.dismiss(); // Clear any existing toasts

    const response = await authApi.register({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }

    toast.success('Account created! Please sign in with your new account.');
    navigate('/login');
    setIsLoading(false);
  };

  return (
    <div className="cat-auth-bg relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <img
        src="/paws.png"
        alt=""
        className="paw-float pointer-events-none absolute right-8 top-14 h-12 w-12"
      />
      <img
        src="/paws.png"
        alt=""
        className="paw-float-reverse pointer-events-none absolute bottom-12 left-8 h-14 w-14"
      />
      <img
        src="/paws.png"
        alt=""
        className="paw-float pointer-events-none absolute right-1/3 top-1/2 h-10 w-10 opacity-10"
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
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Join the Cat Club</h2>
          <p className="mt-2 text-muted-foreground">
            Create your account and start posting paw-some stories.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/90">
            Side quest: earn instant respect from neighborhood cats.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
