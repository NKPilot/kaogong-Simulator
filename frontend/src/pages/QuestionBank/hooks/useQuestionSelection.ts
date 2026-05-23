import { useCallback } from 'react';
import { useQuestionBankStore } from '../../../store/questionBankStore';
import type { Question } from '../../../types/question';

export function useQuestionSelection() {
  const {
    selectedIds,
    questions,
    toggleSelect,
    isSelected,
    isMaxReached,
    canProceed,
    resetSelection,
  } = useQuestionBankStore();

  const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));
  const selectedCount = selectedIds.length;

  const handleToggleSelect = useCallback((question: Question) => {
    toggleSelect(question.id);
  }, [toggleSelect]);

  const isCheckboxDisabled = useCallback((question: Question) => {
    return isMaxReached() && !isSelected(question.id);
  }, [isMaxReached, isSelected]);

  return {
    selectedIds,
    selectedQuestions,
    selectedCount,
    isSelected,
    isMaxReached,
    canProceed,
    handleToggleSelect,
    isCheckboxDisabled,
    resetSelection,
  };
}
