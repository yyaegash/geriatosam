import { useState } from "react";

const STORAGE_KEY = "geriatrie_answers_v1";

export function useLocalAnswers() {
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const setAnswer = (id: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearAnswers = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
  };

  return [answers, setAnswer, clearAnswers] as const;
}
