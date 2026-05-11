const HDW_KEY = 'hdw2026_intake';

function saveIntake(intake) {
  localStorage.setItem(HDW_KEY, JSON.stringify(intake));
}

function loadIntake() {
  const stored = localStorage.getItem(HDW_KEY);
  if (stored === null) {
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearIntake() {
  localStorage.removeItem(HDW_KEY);
}

function hasIntake() {
  return localStorage.getItem(HDW_KEY) !== null;
}

export { saveIntake, loadIntake, clearIntake, hasIntake, HDW_KEY };
