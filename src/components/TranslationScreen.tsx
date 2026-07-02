"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useAnimation, useTransform, MotionValue, useSpring, useMotionValueEvent } from 'framer-motion';

// Shared sleek styling
const glassmorphismStyle = {
  background: 'rgba(255, 255, 255, 0.15)', // Translucent glossy white
  backdropFilter: 'blur(4px)', // Frosted glass effect
  WebkitBackdropFilter: 'blur(4px)',
  border: '2px solid rgba(245, 237, 237, 1)', // Shiny edge
  borderRadius: '5px', // Sleek rounded corners
  boxShadow: '0 20px 40px -10px rgba(255, 255, 255, 0.13), inset 0 1px 0 rgba(255, 255, 255, 1)', // Subtle light glow and inner rim
  color: '#ffffff', // Need white text since background is translucent on black
};

// Sub-component for translated words so they each get their own physics
const TranslatedWordBox = ({ lang, translation, containerRef, index, registerRef }: { lang: string, translation: string, containerRef: React.RefObject<HTMLDivElement>, index: number, registerRef: (el: HTMLDivElement | null, idx: number) => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 + 0.1 }}
    >
      <motion.div
        ref={(el) => {
          boxRef.current = el;
          registerRef(el, index);
        }}
        drag
        dragConstraints={containerRef}
        dragElastic={0.6}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 10 }}
        onDragEnd={() => {
          controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 12 } });
        }}
        style={{
          x, y, cursor: 'grab',
          ...glassmorphismStyle,
          padding: '1.2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem',
          minWidth: '200px', 
          minHeight: '90px'
        }}
        animate={controls}
      >
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
          {lang.toUpperCase()}
        </span>
        <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {translation}
        </span>
      </motion.div>
    </motion.div>
  );
};

import { useAnimationFrame } from 'framer-motion';

// The highly performant dynamic SVG ray system!
const PrismRays = ({ mainRef, targetRefs, count }: { mainRef: React.RefObject<HTMLDivElement>, targetRefs: React.MutableRefObject<(HTMLDivElement | null)[]>, count: number }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useAnimationFrame(() => {
     if (!svgRef.current || !mainRef.current) return;
     const mainRect = mainRef.current.getBoundingClientRect();
     // Calculate top point (bottom center of main terminal)
     const topX = mainRect.left + mainRect.width / 2;
     // Slight overlap so the ray seems to come from INSIDE the terminal glass
     const topY = mainRect.bottom; 
     
     const polygons = svgRef.current.querySelectorAll('polygon');
     
     for (let index = 0; index < count; index++) {
        const target = targetRefs.current[index];
        const poly = polygons[index];
        if (!target || !poly) continue;
        
        const targetRect = target.getBoundingClientRect();
        // Base of the triangle is the top edge of the translated terminal
        const p1 = `${topX},${topY}`;
        const p2 = `${targetRect.right},${targetRect.top}`;
        const p3 = `${targetRect.left},${targetRect.top}`;
        
        // This mutates the DOM directly without triggering React renders, ensuring buttery smooth 120fps tracking!
        poly.setAttribute('points', `${p1} ${p2} ${p3}`);
     }
  });

  return (
    <svg 
      ref={svgRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: '30',
        pointerEvents: 'none',
        zIndex: 0,
        filter: 'blur(1px)', // Softens the edges of the light rays to make it feel like real scattered light!
      }}
    >
       {Array.from({ length: count }).map((_, index) => {
          // We start at 0 (Red) and map the HSL spectrum across the number of targets. 
          const hue = count === 1 ? 200 : (360 / count) * index;
          return (
             <polygon
                key={index}
                fill={`hsla(${hue}, 100%, 50%, 0.35)`} // Vibrant translucent spectrum
                style={{ mixBlendMode: 'screen' }} // Makes the overlapping rays glow beautifully
             />
          );
       })}
    </svg>
  );
};

export default function TranslationScreen() {
  const [inputWord, setInputWord] = useState('');
  
  // Expanded language list for a massive cluster!
  const availableLanguages = ['en', 'nl', 'tr', 'fr', 'de', 'es', 'it', 'jp'];
  const [sourceLanguage, setSourceLanguage] = useState('en');
  
  // New target language state
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<string[]>(['nl', 'tr', 'en']);
  const [isFlowerMenuOpen, setIsFlowerMenuOpen] = useState(false);

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<{ [key: string]: string } | null>(null);
  const [translateCounter, setTranslateCounter] = useState(0);

  // Motion values for the main draggable terminal
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const mainBoxRef = useRef<HTMLDivElement>(null);

  // Constraints ref to prevent dragging off-screen
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Array of refs pointing to the translated boxes so the Prism can track them
  const translatedRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ref for clicking outside the language menu
  const menuRef = useRef<HTMLDivElement>(null);

  // Smooth springs to hide the Globe button when the terminal gets close
  const globeXTarget = useMotionValue(0);
  const globeOpacityTarget = useMotionValue(1);
  const globeXSpring = useSpring(globeXTarget, { stiffness: 300, damping: 30 });
  const globeOpacitySpring = useSpring(globeOpacityTarget, { stiffness: 300, damping: 30 });

  const updateGlobeVisibility = () => {
    const currentX = x.get();
    const currentY = y.get();
    // Terminal moving right (X > 100) and moving up (Y < 100) puts it in the top right quadrant
    if (currentX > 600 && currentY < 120) {
      globeXTarget.set(150); // Push off screen to the right
      globeOpacityTarget.set(0); // Fade out
    } else {
      globeXTarget.set(0);
      globeOpacityTarget.set(1);
    }
  };

  useMotionValueEvent(x, "change", updateGlobeVisibility);
  useMotionValueEvent(y, "change", updateGlobeVisibility);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    // Reset position to center smoothly and let width auto-adjust
    controls.start({
      x: 0,
      y: 0,
      width: 'auto',
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    });

    setIsTranslating(true);
    setTranslations(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: inputWord.trim(),
          sourceLanguage,
          targetLanguages: selectedTargetLanguages.filter(lang => lang !== sourceLanguage), // Prevent translating into the source language!
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setTranslations(data.translations);
        setTranslateCounter(c => c + 1);
      } else {
        console.error('Translation failed:', data.error);
        alert('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    // Removed overflow: 'hidden' so dragged items don't vanish behind black borders!
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ------------------------------------------------------------------------------------------------- */}
      {/* PRISM LIGHT RAYS - SITS BEHIND ALL TERMINALS */}
      {/* ------------------------------------------------------------------------------------------------- */}
      {translations && Object.keys(translations).length > 0 && (
        <PrismRays 
          mainRef={mainBoxRef} 
          targetRefs={translatedRefs} 
          count={Object.keys(translations).length} 
        />
      )}

      {/* ------------------------------------------------------------------------------------------------- */}
      {/* FLOWER MENU: TOP RIGHT GLOBE TARGET SELECTOR */}
      {/* ------------------------------------------------------------------------------------------------- */}
      <motion.div style={{ position: 'absolute', top: '3rem', right: '3rem', zIndex: 100, x: globeXSpring, opacity: globeOpacitySpring }}>
        {/* The petals (languages) */}
        <AnimatePresence>
          {isFlowerMenuOpen && availableLanguages.filter(l => l !== sourceLanguage).map((lang, idx, arr) => {
            // Calculate a full 360-degree circle
            const angleStep = (Math.PI * 2) / arr.length;
            const angle = idx * angleStep; 
            const RADIUS = 50; // Increased radius to give the petals proper breathing room
            const targetX = Math.cos(angle) * RADIUS;
            const targetY = Math.sin(angle) * RADIUS;
            
            const isSelected = selectedTargetLanguages.includes(lang);

            return (
              <motion.button
                key={lang}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, x: targetX, y: targetY, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: idx * 0.03 }}
                onClick={() => {
                  setSelectedTargetLanguages(prev => 
                    prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                  );
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  ...glassmorphismStyle, // Placed first so it doesn't overwrite our 50% border radius!
                  position: 'absolute',
                  top: '0.25rem', right: '0.25rem', // Slight offset so they center perfectly behind the smaller globe
                  width: '2.5rem', // Smaller petals
                  height: '2.5rem',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  fontSize: '0.85rem', // Scaled down text
                  background: isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                  border: isSelected ? '2px solid rgba(255,255,255,1)' : '2px solid rgba(255,255,255,0.3)',
                  color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  boxShadow: isSelected ? '0 0 20px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {lang.toUpperCase()}
              </motion.button>
            )
          })}
        </AnimatePresence>

        {/* The main draggable globe button */}
        <motion.div
          drag
          dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
          dragElastic={0.15} // Stiffer elastic acts as a physical boundary/limit on how far it stretches
          onClick={() => setIsFlowerMenuOpen(!isFlowerMenuOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            ...glassmorphismStyle, // Placed first so it doesn't overwrite our 50% border radius!
            position: 'relative',
            width: '3rem', // Smaller globe button
            height: '3rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            zIndex: 101 // Keep above petals
          }}
        >
          {/* Simple Globe/Translate SVG Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </motion.div>
      </motion.div>

      <div style={{ margin: 'auto', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
        {/* Main Draggable Terminal Panel */}
        <motion.div
          ref={mainBoxRef}
          drag
          dragConstraints={containerRef}
          dragElastic={0.6}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 10 }}
          onDragEnd={() => {
            controls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 12 } });
          }}
          style={{ 
            x, 
            y,
            cursor: 'grab',
            overflow: 'visible',
            minWidth: '300px',
            maxWidth: '60vw',
            ...glassmorphismStyle
          }}
          animate={controls}
          initial={{ width: 'auto' }}
        >
          {/* Sleek Translation Input Form */}
          <form onSubmit={handleTranslate} style={{ display: 'flex', padding: '1.2rem 1.5rem', gap: '0.8rem', alignItems: 'flex-start' }}>
            
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  outline: 'none',
                  marginTop: '0.3rem',
                  padding: 0, // Removes native browser padding so hit box exactly matches text
                }}
              >
                {sourceLanguage.toUpperCase()}
              </button>
              
              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '-25px',
                      marginTop: '2rem',
                      ...glassmorphismStyle,
                      padding: '0.3rem',
                      display: 'flex',
                      flexDirection: 'row',
                      zIndex: 50
                    }}
                  >
                    {availableLanguages.map(lang => (
                      <motion.button
                        key={lang}
                        type="button"
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        transition={{ duration: 0.1 }}
                        onClick={() => {
                          setSourceLanguage(lang);
                          setIsLangMenuOpen(false);
                        }}
                        style={{
                          background: sourceLanguage === lang ? 'rgba(255,255,255,0.2)' : 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {lang.toUpperCase()}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span style={{ 
              fontWeight: 'bold', 
              color: '#ffffff',
              userSelect: 'none',
              fontSize: '1.2rem',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.3rem'
            }}>&gt;</span>
            
            <div 
              style={{ position: 'relative', flex: 1, display: 'flex', cursor: 'text', marginTop: '0.3rem' }}
              onClick={() => {
                const span = document.getElementById('translation-input');
                if (span) span.focus();
              }}
            >
              {!inputWord && (
                <span style={{ position: 'absolute', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                  enter text...
                </span>
              )}
              <span
                id="translation-input"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setInputWord(e.currentTarget.textContent || '')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTranslate(e as any);
                  }
                }}
                style={{
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2rem',
                  outline: 'none',
                  minWidth: '100%',
                  display: 'inline-block',
                  wordBreak: 'break-word',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isTranslating || !inputWord.trim()}
              style={{
                background: 'transparent',
                border: 'none',
                color: (isTranslating || !inputWord.trim()) ? 'rgba(255,255,255,0.3)' : '#ffffff',
                cursor: (isTranslating || !inputWord.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginLeft: 'auto',
                transition: 'color 0.2s',
                marginTop: '0.3rem'
              }}
            >
              {isTranslating ? '...' : '->'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Translation Results */}
      <AnimatePresence>
        {translations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: '80vw', // Forces the container to occupy 80% of screen width
              marginTop: '35rem', // Pushes the container to the absolute bottom of the screen
              marginLeft: 'auto', // Centers horizontally
              marginRight: 'auto', // Centers horizontally
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center', // Group them directly in the center
              gap: '0' // Remove the gap between them so they touch
            }}
          >
            {Object.keys(translations).map((lang, index) => (
              <TranslatedWordBox 
                key={`${lang}-${translateCounter}`} 
                lang={lang} 
                translation={translations[lang]} 
                containerRef={containerRef} 
                index={index}
                registerRef={(el, idx) => { translatedRefs.current[idx] = el; }} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
