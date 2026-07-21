export default function FlashcardsPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#ffffff',
      fontFamily: 'var(--font-mono)'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>Flashcards</h1>
      <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>
        The study mode is under construction...
      </p>
    </div>
  );
}
