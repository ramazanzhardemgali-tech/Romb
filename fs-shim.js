export function initializeApp(config) { return { config }; }
export function getApps() { return [{ config: {} }]; }
export function getApp() { return { config: {} }; }
export async function deleteApp() {}

export function getAuth() {
  return {
    currentUser: {
      uid: 'player_' + Math.random().toString(36).slice(2, 10),
      getIdToken: async () => 'ok'
    }
  };
}

export async function signInAnonymously(auth) {
  return { user: auth.currentUser };
}

export async function signInWithCustomToken(auth) {
  return { user: auth.currentUser };
}

export function getFirestore() {
  return { _isCustomBackend: true };
}

export function doc(db, ...segments) {
  const code = segments[segments.length - 1];
  return { code };
}

export async function getDoc(roomRef) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomRef.code)}`);
  if (!res.ok) {
    return { exists: () => false, data: () => null };
  }
  const json = await res.json();
  return {
    exists: () => Boolean(json.exists),
    data: () => json.data
  };
}

export async function setDoc(roomRef, payload) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomRef.code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Ошибка создания комнаты на сервере');
}

export async function updateDoc(roomRef, patch) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomRef.code)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error('Ошибка обновления данных комнаты');
}

export function onSnapshot(roomRef, onNext, onError) {
  let active = true;
  let lastSnapshotJson = '';

  const poll = async () => {
    if (!active) return;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomRef.code)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        const serialized = JSON.stringify(json.data || {});
        if (serialized !== lastSnapshotJson) {
          lastSnapshotJson = serialized;
          onNext({
            exists: () => Boolean(json.exists),
            data: () => json.data
          });
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
    if (active) {
      setTimeout(poll, 700);
    }
  };

  poll();

  return () => {
    active = false;
  };
}
