/**
 * Hooks réutilisables pour la gestion des formulaires CSV
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BaseQuestion,
  CsvRow,
  FormConfig,
  FormState,
  QuestionType,
  QuestionRole
} from './types';
import {
  norm,
  parseList,
  parseChoices,
  normalizeId,
  detectCsvDelimiter
} from './utils';
import { FORM_CONSTANTS } from './constants';

/**
 * Hook pour gérer l'état d'un formulaire CSV
 */
export function useCsvForm(config: FormConfig) {
  const [state, setState] = useState<FormState>({
    questions: [],
    answers: {},
    isLoading: true,
    error: undefined
  });

  // Chargement des réponses depuis le localStorage
  const loadAnswersFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(config.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [config.storageKey]);

  // Sauvegarde d'une réponse
  const setAnswer = useCallback((id: string, value: string) => {
    setState(prev => {
      const newAnswers = { ...prev.answers, [id]: value };
      localStorage.setItem(config.storageKey, JSON.stringify(newAnswers));
      return {
        ...prev,
        answers: newAnswers
      };
    });
  }, [config.storageKey]);

  // Effacement des réponses locales
  const clearLocal = useCallback(() => {
    localStorage.removeItem(config.storageKey);
    setState(prev => ({
      ...prev,
      answers: {}
    }));
  }, [config.storageKey]);

  // Chargement du CSV
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    // Charger les réponses depuis localStorage
    let savedAnswers: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(config.storageKey);
      savedAnswers = raw ? JSON.parse(raw) : {};
    } catch {
      savedAnswers = {};
    }

    fetch(config.csvPath)
      .then(response => response.text())
      .then(csvText => {
        const delimiter = detectCsvDelimiter(csvText);
        const parsed = Papa.parse<CsvRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter
        });

        const rows = (parsed.data || []) as CsvRow[];
        const questions = processQuestions(rows, config);

        setState(prev => ({
          ...prev,
          questions,
          answers: savedAnswers,
          isLoading: false,
          error: undefined
        }));
      })
      .catch(error => {
        console.error('Erreur de lecture CSV:', error);
        setState(prev => ({
          ...prev,
          questions: [],
          isLoading: false,
          error: error.message
        }));
      });
  }, [config.csvPath, config.sectionName, config.groupName, config.storageKey]);

  return {
    ...state,
    setAnswer,
    clearLocal
  };
}

/**
 * Traite les lignes CSV en questions normalisées
 */
function processQuestions(rows: CsvRow[], config: FormConfig): BaseQuestion[] {
  const filtered = rows
    .filter(row => {
      // Garder les lignes qui ont une Question, ou qui sont de type Information, ou qui ont des Options
      if (!row || (!row.Question && row.Type !== "Information" && !row.Options)) return false;

      const matchFields = [row.Section, row.Group].filter(Boolean);
      if (!matchFields.length) return true;

      // Si on a un sectionName ou groupName, on filtre
      if (config.sectionName) {
        return matchFields.some(field =>
          norm(String(field)) === norm(config.sectionName!)
        );
      }
      if (config.groupName) {
        return matchFields.some(field =>
          norm(String(field)) === norm(config.groupName!)
        );
      }

      return true;
    })
    .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

  return filtered.map((row, index) => {
    const pos = Number(row.QPos || index + 1);
    const type = normalizeType(row.Type);
    const role = normalizeRole(row.Role, row.Question);
    const { shown, raw } = parseChoices(row.Options, true);

    const sectionName = config.sectionName || config.groupName || row.Section || row.Group || "unknown";

    // Si pas de label, essayer de générer un depuis les options ou section
    let questionLabel = row.Question?.trim() || "";
    if (!questionLabel && row.Options) {
      // Extraire le premier terme des options (ex: "utiliser un téléphone:1" -> "utiliser un téléphone")
      const firstOption = parseList(row.Options)[0];
      if (firstOption) {
        const optionText = firstOption.split(':')[0].trim();
        questionLabel = `Difficulté pour ${optionText}`;
      }
    }

    return {
      id: normalizeId(sectionName, questionLabel, pos),
      label: questionLabel,
      type,
      options: shown,
      rawOptions: raw,
      role,
      qpos: pos,
      triggerOnLock: parseList(row.TriggerOn).length
        ? parseList(row.TriggerOn)
        : [...FORM_CONSTANTS.DEFAULT_TRIGGER_LOCK],
      triggerOnReport: parseList(row.TriggerReportOn),
      surveillanceItems: parseList(row.Surveillance),
      actionItems: parseList(row.Actions),
      tooltip: row.Tooltip?.trim() || undefined
    };
  });
}

/**
 * Normalise le type d'une question
 */
function normalizeType(type?: string): QuestionType {
  const normalized = (type || FORM_CONSTANTS.DEFAULT_QUESTION_TYPE).toLowerCase();
  const validTypes: QuestionType[] = ["radio", "checkbox", "text", "textarea", "information"];

  return validTypes.includes(normalized as QuestionType)
    ? normalized as QuestionType
    : FORM_CONSTANTS.DEFAULT_QUESTION_TYPE;
}

/**
 * Normalise le rôle d'une question
 */
function normalizeRole(role?: string, questionLabel?: string): QuestionRole {
  const roleRaw = (role || "").trim().toLowerCase();

  // Rôles explicites
  if (roleRaw === FORM_CONSTANTS.QUESTION_ROLES.LOCK) return "lock";
  if (roleRaw === FORM_CONSTANTS.QUESTION_ROLES.COLOR) return "color";
  if (roleRaw === FORM_CONSTANTS.QUESTION_ROLES.FREQ) return "freq";
  if (roleRaw === FORM_CONSTANTS.QUESTION_ROLES.SCORE) return "score";

  // Détection automatique pour "À revoir" / "A revoir"
  if (questionLabel) {
    const normalizedLabel = norm(questionLabel);
    if (["a revoir", "à revoir"].includes(normalizedLabel)) {
      return "lock";
    }
  }

  return "";
}

/**
 * Hook pour gérer l'état de verrouillage d'un formulaire
 */
export function useFormLock(questions: BaseQuestion[], answers: Record<string, string>) {
  return useMemo(() => {
    const lockQuestions = questions.filter(q => q.role === "lock");

    return lockQuestions.some(q => {
      const value = answers[q.id];
      if (!value) return false;

      return q.triggerOnLock.some(trigger =>
        norm(trigger) === norm(value) || trigger === "*"
      );
    });
  }, [questions, answers]);
}

/**
 * Hook pour calculer un rapport à partir des réponses
 */
export function useFormReport(
  questions: BaseQuestion[],
  answers: Record<string, string>,
  isLocked = false
) {
  return useMemo(() => {
    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    const relevantQuestions = isLocked
      ? questions.filter(q => q.role === "lock")
      : questions;

    relevantQuestions.forEach(question => {
      const value = answers[question.id];
      if (!value) return;

      // Vérifier si cette réponse déclenche un ajout au rapport
      const shouldTrigger = question.triggerOnReport.includes("*") ||
        question.triggerOnReport.some(trigger => norm(trigger) === norm(value));

      if (shouldTrigger) {
        question.surveillanceItems.forEach(item => reperageSet.add(item));
        question.actionItems.forEach(item => propositionSet.add(item));
      }
    });

    return {
      reperage: Array.from(reperageSet),
      proposition: Array.from(propositionSet)
    };
  }, [questions, answers, isLocked]);
}