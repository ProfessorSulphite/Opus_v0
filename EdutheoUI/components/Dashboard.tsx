import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  BookOpen, 
  BarChart3, 
  Brain, 
  Filter, 
  Zap, 
  Target, 
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Dashboard({ onNavigate, onLogout }: DashboardProps) {
  const quickStats = [
    { label: 'Questions Solved', value: '247', icon: Target, color: 'text-primary' },
    { label: 'Accuracy Rate', value: '85%', icon: TrendingUp, color: 'text-accent' },
    { label: 'Study Streak', value: '12 days', icon: Zap, color: 'text-primary' },
    { label: 'Time Spent', value: '24h', icon: Clock, color: 'text-accent' },
  ];

  const navigationCards = [
    {
      title: 'Practice MCQs',
      description: 'Solve physics questions and improve your understanding',
      icon: BookOpen,
      gradient: 'from-primary/20 to-primary/5',
      action: () => onNavigate('practice'),
      stats: '150+ questions available'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress and identify weak areas',
      icon: BarChart3,
      gradient: 'from-accent/20 to-accent/5',
      action: () => onNavigate('analytics'),
      stats: 'Detailed performance insights'
    },
    {
      title: 'AI Tutor',
      description: 'Get personalized help and explanations',
      icon: Brain,
      gradient: 'from-secondary/20 to-secondary/5',
      action: () => {},
      stats: 'Coming Soon',
      disabled: true
    }
  ];

  const recentTopics = [
    { name: 'Kinematics', progress: 85, questions: 12 },
    { name: 'Newton\'s Laws', progress: 70, questions: 8 },
    { name: 'Work & Energy', progress: 45, questions: 6 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <BookOpen className="w-8 h-8 text-primary" />
                <Zap className="w-4 h-4 text-accent absolute -top-1 -right-1" />
              </div>
              <span className="text-xl font-bold neon-text">Edutheo</span>
            </motion.div>

            {/* Quick Filters */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-primary/30 text-muted-foreground">
                <Filter className="w-4 h-4 mr-2" />
                Subject: Physics
              </Button>
              <Button variant="outline" size="sm" className="border-primary/30 text-muted-foreground">
                Chapter: All
              </Button>
              <Button variant="outline" size="sm" className="border-primary/30 text-muted-foreground">
                Difficulty: Mixed
              </Button>
            </div>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                >
                  <Avatar className="border-2 border-primary/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/20 text-primary">AH</AvatarFallback>
                  </Avatar>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-primary/20">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">Ahmed Hassan</p>
                  <p className="text-xs text-muted-foreground">9th Grade Student</p>
                </div>
                <DropdownMenuSeparator className="bg-primary/20" />
                <DropdownMenuItem className="text-muted-foreground hover:text-white hover:bg-primary/20">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-white hover:bg-primary/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, Ahmed! 👋
              </h1>
              <p className="text-muted-foreground">
                Ready to continue your physics journey?
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              <Award className="w-4 h-4 mr-1" />
              Physics Explorer
            </Badge>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => (
            <Card key={stat.label} className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Cards */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid gap-4">
                {navigationCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group"
                  >
                    <Card 
                      className={`glass-card border-primary/20 cursor-pointer transition-all duration-300 hover:glow-secondary ${card.disabled ? 'opacity-60' : ''}`}
                      onClick={card.disabled ? undefined : card.action}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} group-hover:scale-110 transition-transform duration-300`}>
                              <card.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {card.title}
                                {card.disabled && (
                                  <Badge variant="secondary" className="ml-2 text-xs bg-muted/20">
                                    Soon
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-muted-foreground text-sm mb-2">
                                {card.description}
                              </p>
                              <p className="text-xs text-primary">{card.stats}</p>
                            </div>
                          </div>
                          {!card.disabled && (
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Progress */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Topics</CardTitle>
                  <CardDescription>Your progress this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTopics.map((topic, index) => (
                    <div key={topic.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{topic.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {topic.questions} questions
                        </span>
                      </div>
                      <Progress 
                        value={topic.progress} 
                        className="h-2 bg-secondary"
                      />
                      <div className="text-right">
                        <span className="text-xs text-primary">{topic.progress}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Daily Goal
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Solve 5 more questions to complete today's target!
                    </p>
                    <Progress value={70} className="mb-2" />
                    <p className="text-xs text-primary">7 of 10 questions completed</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-8 border-t border-primary/20"
        >
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Edutheo | Built by Students for Students
            </p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}