import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Flag,
  RotateCcw,
  Home
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface MCQPracticePageProps {
  onNavigate: (page: string) => void;
}

const mockQuestions = [
  {
    id: 1,
    question: "A ball is thrown vertically upward with an initial velocity of 20 m/s. What is the maximum height reached by the ball? (Take g = 10 m/s²)",
    options: [
      "10 m",
      "15 m", 
      "20 m",
      "25 m"
    ],
    correctAnswer: 2,
    explanation: "Using the equation v² = u² + 2as, where v = 0 (at maximum height), u = 20 m/s, a = -g = -10 m/s². Solving: 0 = 400 + 2(-10)s, which gives s = 20 m.",
    difficulty: "Medium",
    topic: "Kinematics",
    bloomLevel: "Apply"
  },
  {
    id: 2,
    question: "According to Newton's first law of motion, an object at rest will:",
    options: [
      "Always remain at rest",
      "Remain at rest unless acted upon by an external force",
      "Start moving after some time",
      "Move with constant acceleration"
    ],
    correctAnswer: 1,
    explanation: "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
    difficulty: "Easy",
    topic: "Newton's Laws",
    bloomLevel: "Remember"
  },
  {
    id: 3,
    question: "If the kinetic energy of an object is doubled, by what factor does its speed increase?",
    options: [
      "2",
      "4",
      "√2",
      "1/2"
    ],
    correctAnswer: 2,
    explanation: "Since KE = ½mv², if KE is doubled, then 2(½mv²) = ½m(v')². This gives v'² = 2v², so v' = √2 × v. The speed increases by a factor of √2.",
    difficulty: "Hard",
    topic: "Work & Energy",
    bloomLevel: "Analyze"
  }
];

export function MCQPracticePage({ onNavigate }: MCQPracticePageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);

  const question = mockQuestions[currentQuestion];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleOptionSelect = (optionIndex: number) => {
    if (showAnswer) return;
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setShowAnswer(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion]));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedOption(null);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const resetQuestion = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setShowExplanation(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium text-white">Physics Practice</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>25:30</span>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                Question {currentQuestion + 1} of {totalQuestions}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-4">
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {question.topic}
                          </Badge>
                          <Badge variant="secondary" className="bg-accent/20 text-accent">
                            {question.bloomLevel}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl text-white leading-relaxed">
                          {question.question}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMarkForReview}
                        className={`${markedForReview.has(currentQuestion) ? 'text-yellow-400' : 'text-muted-foreground'} hover:text-yellow-400`}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Options */}
                    <div className="space-y-3">
                      {question.options.map((option, index) => {
                        let buttonClass = "w-full text-left p-4 rounded-lg border transition-all duration-300 ";
                        
                        if (showAnswer) {
                          if (index === question.correctAnswer) {
                            buttonClass += "bg-green-500/20 border-green-500/50 text-green-400";
                          } else if (index === selectedOption && selectedOption !== question.correctAnswer) {
                            buttonClass += "bg-red-500/20 border-red-500/50 text-red-400";
                          } else {
                            buttonClass += "bg-muted/10 border-muted/30 text-muted-foreground";
                          }
                        } else {
                          if (selectedOption === index) {
                            buttonClass += "bg-primary/20 border-primary/50 text-primary glow-secondary";
                          } else {
                            buttonClass += "bg-card/50 border-primary/20 text-white hover:bg-primary/10 hover:border-primary/30";
                          }
                        }

                        return (
                          <motion.button
                            key={index}
                            whileHover={{ scale: showAnswer ? 1 : 1.01 }}
                            whileTap={{ scale: showAnswer ? 1 : 0.99 }}
                            onClick={() => handleOptionSelect(index)}
                            className={buttonClass}
                            disabled={showAnswer}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-current flex items-center justify-center text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1">{option}</span>
                              {showAnswer && index === question.correctAnswer && (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              )}
                              {showAnswer && index === selectedOption && selectedOption !== question.correctAnswer && (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-2">
                        {!showAnswer ? (
                          <Button
                            onClick={handleCheckAnswer}
                            disabled={selectedOption === null}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                          >
                            Check Answer
                          </Button>
                        ) : (
                          <Button
                            onClick={resetQuestion}
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Try Again
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestion === 0}
                          className="border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                        <Button
                          onClick={handleNextQuestion}
                          disabled={currentQuestion === totalQuestions - 1}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>

                    {/* Explanation */}
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-primary hover:text-primary/80 hover:bg-primary/10 mt-4"
                            >
                              <Lightbulb className="w-4 h-4 mr-2" />
                              {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                              <h4 className="font-medium text-accent mb-2">Explanation:</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {question.explanation}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Question Navigator */}
          <div className="space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {mockQuestions.map((_, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentQuestion(index)}
                      className={`
                        relative w-10 h-10 rounded-lg border text-sm font-medium transition-all duration-300
                        ${index === currentQuestion 
                          ? 'bg-primary text-primary-foreground border-primary glow-primary' 
                          : answeredQuestions.has(index)
                          ? 'bg-accent/20 text-accent border-accent/30'
                          : 'bg-card/50 text-muted-foreground border-primary/20 hover:border-primary/50'
                        }
                      `}
                    >
                      {index + 1}
                      {markedForReview.has(index) && (
                        <Flag className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <span className="text-accent">{answeredQuestions.size}/{totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Marked</span>
                    <span className="text-yellow-400">{markedForReview.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="text-primary">{totalQuestions - answeredQuestions.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => onNavigate('dashboard')}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}