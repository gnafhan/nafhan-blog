'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (name.length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      validationErrors.push('Please enter a valid email address');
    }

    if (password.length < 6) {
      validationErrors.push('Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      validationErrors.push('Passwords do not match');
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.';
      const errorArray = Array.isArray(errorMessage) ? errorMessage : [errorMessage];
      setErrors(errorArray);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to start creating and sharing blog posts
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
