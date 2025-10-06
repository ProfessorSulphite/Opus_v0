import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Brain, 
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from 'recharts';

interface AnalyticsPageProps {
  onNavigate: (page: string) => void;
}

const weeklyProgressData = [
  { day: 'Mon', questions: 12, accuracy: 85 },
  { day: 'Tue', questions: 8, accuracy: 78 },
  { day: 'Wed', questions: 15, accuracy: 92 },
  { day: 'Thu', questions: 10, accuracy: 88 },
  { day: 'Fri', questions: 18, accuracy: 90 },
  { day: 'Sat', questions: 22, accuracy: 87 },
  { day: 'Sun', questions: 16, accuracy: 94 },
];

const topicPerformanceData = [
  { topic: 'Kinematics', score: 85, total: 100, difficulty: 'Medium' },
  { topic: 'Newton\'s Laws', score: 92, total: 100, difficulty: 'Easy' },
  { topic: 'Work & Energy', score: 78, total: 100, difficulty: 'Hard' },
  { topic: 'Gravitation', score: 65, total: 100, difficulty: 'Hard' },
  { topic: 'Oscillations', score: 70, total: 100, difficulty: 'Medium' },
];

const difficultyBreakdownData = [
  { name: 'Easy', value: 45, color: '#00C853' },
  { name: 'Medium', value: 35, color: '#00FF85' },
  { name: 'Hard', value: 20, color: '#004D40' },
];

const bloomLevelData = [
  { level: 'Remember', questions: 25, percentage: 30 },
  { level: 'Understand', questions: 30, percentage: 36 },
  { level: 'Apply', questions: 20, percentage: 24 },
  { level: 'Analyze', questions: 8, percentage: 10 },
];

const streakData = [
  { name: 'Current Streak', value: 12, max: 15, color: '#00FF85' },
  { name: 'Best Streak', value: 15, max: 15, color: '#00C853' },
];

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const totalQuestions = 247;
  const overallAccuracy = 85;
  const studyTime = 24.5; // hours
  const currentStreak = 12;

  const getTopicColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-500/20';
    if (score >= 70) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6 bg-primary/20" />
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-medium text-white">Performance Analytics</span>
              </div>
            </div>

            <Badge variant="outline" className="border-primary/30 text-primary">
              <Calendar className="w-4 h-4 mr-1" />
              Last 7 Days
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questions Solved</p>
                  <p className="text-3xl font-bold text-white">{totalQuestions}</p>
                  <p className="text-xs text-green-400 mt-1">+23 this week</p>
                </div>
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                  <p className="text-3xl font-bold text-white">{overallAccuracy}%</p>
                  <p className="text-xs text-green-400 mt-1">+3% improvement</p>
                </div>
                <div className="p-3 bg-accent/20 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Time</p>
                  <p className="text-3xl font-bold text-white">{studyTime}h</p>
                  <p className="text-xs text-primary mt-1">This week</p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-xl">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Study Streak</p>
                  <p className="text-3xl font-bold text-white">{currentStreak} days</p>
                  <p className="text-xs text-yellow-400 mt-1">3 days to record!</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-primary/20">
              <TabsTrigger value="progress" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Activity className="w-4 h-4 mr-2" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="topics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <BookOpen className="w-4 h-4 mr-2" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="difficulty" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <PieChart className="w-4 h-4 mr-2" />
                Difficulty
              </TabsTrigger>
              <TabsTrigger value="streaks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Award className="w-4 h-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Progress Chart */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Weekly Progress</CardTitle>
                    <CardDescription>Questions solved and accuracy over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={weeklyProgressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 133, 0.1)" />
                        <XAxis dataKey="day" stroke="#E0E0E0" />
                        <YAxis stroke="#E0E0E0" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A3328', 
                            border: '1px solid rgba(0, 255, 133, 0.2)',
                            borderRadius: '8px',
                            color: '#E0E0E0'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="questions" 
                          stroke="#00FF85" 
                          fill="rgba(0, 255, 133, 0.2)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Accuracy Trend */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Accuracy Trend</CardTitle>
                    <CardDescription>Your accuracy percentage over the week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyProgressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 133, 0.1)" />
                        <XAxis dataKey="day" stroke="#E0E0E0" />
                        <YAxis domain={[70, 100]} stroke="#E0E0E0" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A3328', 
                            border: '1px solid rgba(0, 255, 133, 0.2)',
                            borderRadius: '8px',
                            color: '#E0E0E0'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#00C853" 
                          strokeWidth={3}
                          dot={{ fill: '#00C853', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Topic Performance Chart */}
                <div className="lg:col-span-2">
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-white">Topic Performance</CardTitle>
                      <CardDescription>Your scores across different physics topics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topicPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 133, 0.1)" />
                          <XAxis dataKey="topic" stroke="#E0E0E0" />
                          <YAxis domain={[0, 100]} stroke="#E0E0E0" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1A3328', 
                              border: '1px solid rgba(0, 255, 133, 0.2)',
                              borderRadius: '8px',
                              color: '#E0E0E0'
                            }} 
                          />
                          <Bar dataKey="score" fill="#00FF85" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Strong vs Weak Topics */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Topic Breakdown</CardTitle>
                    <CardDescription>Detailed performance analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topicPerformanceData.map((topic, index) => (
                      <div key={topic.topic} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getDifficultyColor(topic.difficulty)} variant="secondary">
                              {topic.difficulty}
                            </Badge>
                            <span className={`text-sm font-medium px-2 py-1 rounded ${getTopicColor(topic.score)}`}>
                              {topic.score}%
                            </span>
                          </div>
                        </div>
                        <Progress value={topic.score} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="difficulty" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Difficulty Breakdown Pie Chart */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Question Difficulty Distribution</CardTitle>
                    <CardDescription>Breakdown of questions by difficulty level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie 
                          data={difficultyBreakdownData}
                          cx="50%" 
                          cy="50%" 
                          outerRadius={100}
                          dataKey="value"
                        >
                          {difficultyBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A3328', 
                            border: '1px solid rgba(0, 255, 133, 0.2)',
                            borderRadius: '8px',
                            color: '#E0E0E0'
                          }} 
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bloom's Taxonomy Levels */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Learning Levels</CardTitle>
                    <CardDescription>Questions by Bloom's Taxonomy level</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bloomLevelData.map((level, index) => (
                      <div key={level.level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{level.level}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">{level.questions} questions</span>
                            <span className="text-sm text-primary font-medium">{level.percentage}%</span>
                          </div>
                        </div>
                        <Progress value={level.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="streaks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Streak Visualization */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Study Streaks</CardTitle>
                    <CardDescription>Your consistency in studying</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={streakData}>
                        <RadialBar dataKey="value" cornerRadius={10} fill="#00FF85" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1A3328', 
                            border: '1px solid rgba(0, 255, 133, 0.2)',
                            borderRadius: '8px',
                            color: '#E0E0E0'
                          }} 
                        />
                        <Legend />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Achievements</CardTitle>
                    <CardDescription>Milestones you've reached</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <Award className="w-8 h-8 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium text-white">Physics Explorer</h4>
                        <p className="text-xs text-muted-foreground">Solved 200+ questions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <Zap className="w-8 h-8 text-accent" />
                      <div>
                        <h4 className="text-sm font-medium text-white">Streak Master</h4>
                        <p className="text-xs text-muted-foreground">10+ day study streak</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <Target className="w-8 h-8 text-yellow-400" />
                      <div>
                        <h4 className="text-sm font-medium text-white">Accuracy Expert</h4>
                        <p className="text-xs text-muted-foreground">85%+ accuracy rate</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <Brain className="w-8 h-8 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium text-white">Knowledge Seeker</h4>
                        <p className="text-xs text-muted-foreground">Completed 5 topics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="glass-card border-primary/20 text-center">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-primary mb-4">
                  "Small steps daily → big results tomorrow."
                </h3>
                <p className="text-muted-foreground">
                  Keep up the great work! Your consistent effort is paying off. 
                  You're on track to master physics concepts one question at a time.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}