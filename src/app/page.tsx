"use client";

import { useState, useEffect } from 'react';
import TranslationScreen from "@/components/TranslationScreen";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }} />;
  }

  return (
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>
      <TranslationScreen />
    </main>
  );
}
