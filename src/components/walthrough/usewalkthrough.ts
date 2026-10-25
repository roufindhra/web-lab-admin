import { useState } from "react";

export function useWalkthrough(totalSteps: number) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeWalkthrough();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeWalkthrough = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };

  const reopenWalkthrough = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  return {
    isOpen,
    currentStep,
    nextStep,
    prevStep,
    completeWalkthrough,
    reopenWalkthrough,
  };
}
