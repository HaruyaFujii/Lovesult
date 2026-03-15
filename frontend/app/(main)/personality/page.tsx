'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuestions, useSubmitPersonality } from '@/hooks/use-personality';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Heart, Loader2 } from 'lucide-react';

export default function PersonalityQuizPage() {
  const router = useRouter();
  const { data: questionsData, isLoading } = useQuestions();
  const { mutate: submit, isPending } = useSubmitPersonality();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  if (isLoading || !questionsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const questions = questionsData.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      submit(answers, {
        onSuccess: () => {
          router.push('/personality/result');
        },
      });
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          恋愛傾向診断
        </h1>
        <p className="text-gray-600">
          10個の質問に答えて、あなたの恋愛タイプを診断しましょう
        </p>
      </div>

      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-500 mt-2">
          {currentIndex + 1} / {questions.length}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">
          Q{currentQuestion.id}. {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                answers[currentIndex] === index
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[currentIndex] === index
                      ? 'border-pink-500'
                      : 'border-gray-300'
                  }`}
                >
                  {answers[currentIndex] === index && (
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                  )}
                </div>
                <span className="text-gray-800">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          戻る
        </Button>
        <Button
          onClick={handleNext}
          disabled={answers[currentIndex] === undefined || isPending}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              診断中...
            </>
          ) : isLastQuestion ? (
            '結果を見る'
          ) : (
            '次へ'
          )}
        </Button>
      </div>
    </div>
  );
}