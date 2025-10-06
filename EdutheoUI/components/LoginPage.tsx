import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Eye, EyeOff, BookOpen, Zap, TrendingUp } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    rememberMe: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card glow-secondary border-primary/20 overflow-hidden">
          <CardHeader className="text-center space-y-4 pb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto"
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="relative">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <Zap className="w-4 h-4 text-accent absolute -top-1 -right-1" />
                </div>
                <h1 className="text-3xl font-bold neon-text">Edutheo</h1>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <CardTitle className="text-xl text-white">
                {isSignUp ? 'Join Edutheo' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Learn. Practice. Master.
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                  />
                </motion.div>
              )}

              {!isSignUp && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                    className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-300"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>

            {/* Features highlight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 pt-6 border-t border-primary/20"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <BookOpen className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Practice MCQs</p>
                </div>
                <div className="space-y-1">
                  <TrendingUp className="w-5 h-5 text-accent mx-auto" />
                  <p className="text-xs text-muted-foreground">Track Progress</p>
                </div>
                <div className="space-y-1">
                  <Zap className="w-5 h-5 text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">AI Insights</p>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Built by Students for Students
        </motion.p>
      </motion.div>
    </div>
  );
}