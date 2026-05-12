import { useState, useCallback } from 'react';

function isUnlocked() { return true; }

export function usePhase() {
  const [activePhase, setActivePhase] = useState(1);

  const selectPhase = useCallback((phase) => {
    if (isUnlocked(PHASE_UNLOCK[phase])) {
      setActivePhase(phase);
    }
  }, []);

  const phaseStatus = {
    1: { unlocked: true, active: activePhase === 1 },
    2: { unlocked: true, active: activePhase === 2 },
    3: { unlocked: true, active: activePhase === 3 },
  };

  return { activePhase, selectPhase, phaseStatus };
}
