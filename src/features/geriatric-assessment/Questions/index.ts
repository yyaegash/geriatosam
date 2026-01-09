/**
 * Export public de tous les composants et types du dossier Questions
 */

// Composants
export { default as AideEnPlaceForm } from './components/AideEnPlaceForm';
export { default as DependenceForm } from './components/DependenceForm';
export { default as GenericCsvForm } from './components/GenericCsvForm';

// Types
export type {
  AideEnPlaceSummary,
  DependenceSummary,
  GenericSummary,
  FormSummary,
  BaseFormHandle,
  BaseFormProps,
  FormConfig
} from './shared/types';

export type { AideEnPlaceHandle } from './components/AideEnPlaceForm';
export type { DependenceHandle } from './components/DependenceForm';
export type { GenericCsvFormHandle } from './components/GenericCsvForm';

// Hooks utilitaires (pour usage avancé)
export {
  useCsvForm,
  useFormLock,
  useFormReport
} from './shared/hooks';

// Utilitaires (pour usage avancé)
export {
  norm,
  stripDiacritics,
  parseList,
  parseChoices,
  normalizeId,
  calculateQualityColor,
  getEffectiveAnswer
} from './shared/utils';

// Constantes
export { FORM_CONSTANTS, STORAGE_PREFIXES } from './shared/constants';