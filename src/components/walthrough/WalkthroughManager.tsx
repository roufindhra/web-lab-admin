import React from "react";
import { useWalkthrough } from "./usewalkthrough";
import { WalkthroughDialog } from "./WalkthroughDialog";
import { WalkthroughFab } from "./WalkthroughFAB";
import { WALKTHROUGH_STEPS } from "./walkthroughdata";

export const WalkthroughManager: React.FC = () => {
  const {
    isOpen,
    currentStep,
    nextStep,
    prevStep,
    completeWalkthrough,
    reopenWalkthrough,
  } = useWalkthrough(WALKTHROUGH_STEPS.length);

  const activeStep = WALKTHROUGH_STEPS[currentStep];

  return (
    <>
      <WalkthroughDialog
        isOpen={isOpen}
        onClose={completeWalkthrough}
        currentStep={currentStep}
        totalSteps={WALKTHROUGH_STEPS.length}
        onNext={nextStep}
        onPrev={prevStep}
        title={activeStep.title}
        description={activeStep.description}
        targetSelector={activeStep.targetSelector}
      />

      <WalkthroughFab
        onClick={reopenWalkthrough}
        isVisible={!isOpen}
      />
    </>
  );
};