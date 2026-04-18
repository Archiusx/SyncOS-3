/**
 * SYNC-OS QUIZ ENGINE: Automated assessment generation using Gemini AI.
 * Transforms current session context into dynamic multiple-choice evaluations.
 */
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Send, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '@/lib/utils';

const getApiKey = () => {
  return (
    process.env.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    ''
  );
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QuizGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleTriggerQuiz = (e: any) => {
      if (e.detail?.topic) {
        setTopic(e.detail.topic);
        // Auto-generate if a specific topic is sent
        setTimeout(() => generateQuiz(e.detail.topic), 100);
      }
    };
    window.addEventListener('syncos-trigger-quiz-internal', handleTriggerQuiz);
    return () => window.removeEventListener('syncos-trigger-quiz-internal', handleTriggerQuiz);
  }, []);

  const syncWithWorkspace = async () => {
    setIsSyncing(true);
    const contextData: any[] = [];
    const handleContextResponse = (e: any) => {
      contextData.push(e.detail);
    };
    window.addEventListener('syncos-context-response', handleContextResponse);
    window.dispatchEvent(new CustomEvent('syncos-request-context'));

    await new Promise(resolve => setTimeout(resolve, 600));
    window.removeEventListener('syncos-context-response', handleContextResponse);

    const globalContext = contextData.map(c => `[WINDOW: ${c.name}]\n${c.content}`).join("\n\n");
    
    if (globalContext) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: `Based on the following workspace context, suggest a specific academic topic for a quiz. Return ONLY the topic name.\n\nCONTEXT:\n${globalContext}`,
        });
        const suggestedTopic = response.text.trim();
        if (suggestedTopic) {
          setTopic(suggestedTopic);
        }
      } catch (error) {
        console.error("Sync Topic Error:", error);
      }
    }
    setIsSyncing(false);
  };

  const generateQuiz = async (overrideTopic?: string) => {
    const activeTopic = overrideTopic || topic;
    if (!activeTopic.trim()) return;
    setIsLoading(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Generate a 5-question multiple choice quiz about ${activeTopic}. Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              },
              required: ["question", "options", "correctAnswer"],
            },
          },
        },
      });

      const data = JSON.parse(response.text || "[]");
      setQuestions(data);
    } catch (error) {
      console.error("Quiz Gen Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white border-b flex items-center gap-2">
        <BrainCircuit className="text-purple-600" size={20} />
        <h2 className="font-semibold text-gray-800">AI Quiz Generator</h2>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {questions.length === 0 && !isLoading && (
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <BrainCircuit size={40} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold">What do you want to be tested on?</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Quantum Physics, World War II, Python Basics"
                  className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500/50 outline-none"
                />
                <button
                  onClick={() => generateQuiz()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Generate
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-500">Or Sync with Workspace</span>
                </div>
              </div>

              <button
                onClick={syncWithWorkspace}
                disabled={isSyncing}
                className="w-full py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <Zap size={18} className={cn("group-hover:scale-110 transition-transform", isSyncing && "animate-pulse")} />
                {isSyncing ? "Scanning Workspace..." : "Auto-Detect Topic from Windows"}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
            <p className="text-gray-500 font-medium">Generating your personalized quiz...</p>
          </div>
        )}

        {questions.length > 0 && !showResult && (
          <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border space-y-8">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-800">
              {questions[currentQuestion].question}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {questions[currentQuestion].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(i)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center",
                    selectedOption === null ? "hover:border-purple-500 hover:bg-purple-50" : "",
                    selectedOption === i && i === questions[currentQuestion].correctAnswer ? "bg-green-50 border-green-500 text-green-700" : "",
                    selectedOption === i && i !== questions[currentQuestion].correctAnswer ? "bg-red-50 border-red-500 text-red-700" : "",
                    selectedOption !== null && i === questions[currentQuestion].correctAnswer ? "bg-green-50 border-green-500 text-green-700" : ""
                  )}
                >
                  <span>{option}</span>
                  {selectedOption !== null && i === questions[currentQuestion].correctAnswer && <CheckCircle size={18} />}
                  {selectedOption === i && i !== questions[currentQuestion].correctAnswer && <XCircle size={18} />}
                </button>
              ))}
            </div>

            {selectedOption !== null && (
              <button
                onClick={nextQuestion}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
              >
                {currentQuestion === questions.length - 1 ? "Finish Quiz" : "Next Question"}
              </button>
            )}
          </div>
        )}

        {showResult && (
          <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border">
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            <div className="text-6xl font-black text-purple-600">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p className="text-gray-500">You got {score} out of {questions.length} questions correct.</p>
            <button
              onClick={() => setQuestions([])}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Try Another Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
