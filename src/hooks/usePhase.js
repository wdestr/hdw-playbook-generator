import { useState, useCallback } from 'react';

const PHASE_UNLOCK = {
  1: null,              // always unlocked
  2: '2026-05-20',
  3: '2026-05-22',
};

function isUnlocked(unlockDate) {
  if (!unlockDate) return true;
  const today = new Date().toISOString().split('T')[0];
  return today >= unlockDate;
}

export function usePhase() {
  const [activePhase, setActivePhase] = useState(1);

  const selectPhase = useCallback((phase) => {
    if (isUnlocked(PHASE_UNLOCK[phase])) {
      setActivePhase(phase);
    }
  }, []);

  const phaseStatus = {
    1: { unlocked: true, active: activePhase === 1 },
    2: { unlocked: isUnlocked(PHASE_UNLOCK[2]), active: activePhase === 2 },
    3: { unlocked: isUnlocked(PHASE_UNLOCK[3]), active: activePhase === 3 },
  };

  return { activePhase, selectPhase, phaseStatus };
}
