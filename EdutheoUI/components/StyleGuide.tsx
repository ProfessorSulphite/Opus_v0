import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { 
  BookOpen, 
  Zap, 
  TrendingUp, 
  Target, 
  Brain, 
  Award,
  Clock,
  BarChart3,
  Lightbulb,
  Flag
} from 'lucide-react';

export function StyleGuide() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="relative">
              <BookOpen className="w-12 h-12 text-primary" />
              <Zap className="w-6 h-6 text-accent absolute -top-1 -right-1" />
            </div>
            <h1 className="text-4xl font-bold neon-text">Edutheo</h1>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Design System</h2>
          <p className="text-muted-foreground">Modern, motivating, and futuristic EdTech interface</p>
        </motion.div>

        {/* Color Palette */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Color Palette</CardTitle>
              <CardDescription>The Edutheo brand colors with neon green aesthetic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <div className="w-full h-20 bg-primary rounded-lg glow-primary"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Primary</p>
                    <p className="text-xs text-muted-foreground">#00FF85</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 bg-background rounded-lg border border-primary/20"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Background</p>
                    <p className="text-xs text-muted-foreground">#0A0F0D</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 bg-card rounded-lg"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Card</p>
                    <p className="text-xs text-muted-foreground">#1A3328</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 bg-secondary rounded-lg"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Secondary</p>
                    <p className="text-xs text-muted-foreground">#004D40</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 bg-accent rounded-lg"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Accent</p>
                    <p className="text-xs text-muted-foreground">#00C853</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Typography */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Typography</CardTitle>
              <CardDescription>Poppins for headings, Inter for body text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Heading 1 - Poppins Bold</h1>
                <h2 className="text-3xl font-semibold text-white mb-2">Heading 2 - Poppins Semibold</h2>
                <h3 className="text-2xl font-semibold text-white mb-2">Heading 3 - Poppins Semibold</h3>
                <h4 className="text-xl font-medium text-white mb-4">Heading 4 - Poppins Medium</h4>
                <p className="text-base text-muted-foreground mb-2">Body text - Inter Regular</p>
                <p className="text-sm text-muted-foreground">Small text - Inter Regular</p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg border border-primary/20">
                <p className="neon-text text-lg font-bold">Neon text effect for brand elements</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Buttons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Buttons</CardTitle>
              <CardDescription>Interactive elements with hover effects and glows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Primary Buttons</h4>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                      Primary Button
                    </Button>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" disabled>
                      Disabled Primary
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Secondary Buttons</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                      Secondary Button
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                      Ghost Button
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Icon Buttons</h4>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                      <Zap className="w-4 h-4 mr-2" />
                      With Icon
                    </Button>
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Practice MCQs
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Cards & Components</CardTitle>
              <CardDescription>Glassmorphism effects with subtle green glows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stat Card */}
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Questions Solved</p>
                        <p className="text-3xl font-bold text-white">247</p>
                        <p className="text-xs text-green-400 mt-1">+23 this week</p>
                      </div>
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Card */}
                <Card className="glass-card border-primary/20 cursor-pointer hover:glow-secondary transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">View Analytics</h3>
                        <p className="text-muted-foreground text-sm">Track your progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Card */}
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">Kinematics</span>
                        <span className="text-sm text-primary font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400">Medium</Badge>
                        <span className="text-xs text-muted-foreground">12 questions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Form Elements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Form Elements</CardTitle>
              <CardDescription>Input fields and interactive components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="bg-input-background border-primary/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Progress Indicators</Label>
                    <Progress value={45} className="h-3" />
                    <Progress value={70} className="h-3" />
                    <Progress value={85} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Badges</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500/20 text-green-400">Easy</Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-400">Medium</Badge>
                      <Badge className="bg-red-500/20 text-red-400">Hard</Badge>
                      <Badge className="bg-primary/20 text-primary border-primary/30">Physics</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Icons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Icon Library</CardTitle>
              <CardDescription>Lucide React icons used throughout the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
                {[
                  { icon: BookOpen, name: 'BookOpen' },
                  { icon: Zap, name: 'Zap' },
                  { icon: TrendingUp, name: 'TrendingUp' },
                  { icon: Target, name: 'Target' },
                  { icon: Brain, name: 'Brain' },
                  { icon: Award, name: 'Award' },
                  { icon: Clock, name: 'Clock' },
                  { icon: BarChart3, name: 'BarChart3' },
                  { icon: Lightbulb, name: 'Lightbulb' },
                  { icon: Flag, name: 'Flag' },
                ].map(({ icon: Icon, name }) => (
                  <div key={name} className="text-center space-y-2">
                    <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">{name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Effects */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Visual Effects</CardTitle>
              <CardDescription>Glassmorphism, glows, and animations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-medium text-white">Glass Effect</h4>
                  <div className="glass-card p-6 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Glassmorphism card with backdrop blur</p>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-medium text-white">Primary Glow</h4>
                  <div className="p-6 bg-card rounded-lg glow-primary">
                    <p className="text-sm text-muted-foreground">Card with primary glow effect</p>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-medium text-white">Secondary Glow</h4>
                  <div className="p-6 bg-card rounded-lg glow-secondary">
                    <p className="text-sm text-muted-foreground">Card with secondary glow effect</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-8 border-t border-primary/20"
        >
          <p className="text-sm text-muted-foreground">
            © 2025 Edutheo | Built by Students for Students
          </p>
        </motion.footer>
      </div>
    </div>
  );
}