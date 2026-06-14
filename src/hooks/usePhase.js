import { useState, useCallback } from 'react';

// All three phases are currently unlocked. This map is the single place to
// gate phases later (e.g. unlock Phase 2/3 only after a playbook exists).
const PHASE_UNLOCK = {
  1: true,
  2: true,
  3: true,
};

export function usePhase() {
  const [activePhase, setActivePhase] = useState(1);

  const selectPhase = useCallback((phase) => {
    if (PHASE_UNLOCK[phase]) {
      setActivePhase(phase);
    }
  }, []);

  const phaseStatus = {
    1: { unlocked: PHASE_UNLOCK[1], active: activePhase === 1 },
    2: { unlocked: PHASE_UNLOCK[2], active: activePhase === 2 },
    3: { unlocked: PHASE_UNLOCK[3], active: activePhase === 3 },
  };

  return { activePhase, selectPhase, phaseStatus };
}
