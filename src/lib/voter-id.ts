/**
 * Identificador persistente do operador/dispositivo para sistema de apoios sem duplicidade.
 */
export function getVoterIdentifier(): string {
  if (typeof window === 'undefined') {
    return 'server-render-fallback';
  }

  const STORAGE_KEY = 'spreadhunter_voter_token';
  let voterId = localStorage.getItem(STORAGE_KEY);

  if (!voterId) {
    // Gera identificador único aleatório criptográfico
    const array = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    const hex = Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    voterId = `opr_${hex}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEY, voterId);
  }

  return voterId;
}

export function getVotedQuestionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('spreadhunter_voted_demands');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveVotedQuestionId(id: string, voted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getVotedQuestionIds();
    if (voted) {
      set.add(id);
    } else {
      set.delete(id);
    }
    localStorage.setItem('spreadhunter_voted_demands', JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Erro ao salvar voto local:', e);
  }
}
