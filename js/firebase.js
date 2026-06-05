  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
  import { getFirestore, doc, updateDoc, increment, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

  const app = initializeApp({
    apiKey: "AIzaSyABGoxOXj0kHuYXFnNmUqcUT0l4FG5J7NU",
    authDomain: "the-grey-mind.firebaseapp.com",
    projectId: "the-grey-mind",
    storageBucket: "the-grey-mind.firebasestorage.app",
    messagingSenderId: "296394264485",
    appId: "1:296394264485:web:707c0e9ab16fdbb676224c"
  });

  const db = getFirestore(app);

  async function trackVisit() {
    const ref = doc(db, 'stats', 'visitors');
    try {
      await updateDoc(ref, { total: increment(1) });
    } catch {
      await setDoc(ref, { total: 1 });
    }
    const snap = await getDoc(ref);
    const count = snap.data()?.total ?? 1;
    const formatted = count.toLocaleString();
    document.getElementById('visitCount').textContent = formatted;
    document.getElementById('visitWrap').style.display = '';
    document.getElementById('visitCountSidebar').textContent = formatted;
    document.getElementById('visitBadge').style.display = 'flex';
  }

  trackVisit();
