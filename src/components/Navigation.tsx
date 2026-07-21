"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const glassmorphismStyle = {
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRight: '2px solid rgba(245, 237, 237, 0.5)',
  boxShadow: '20px 0 40px -10px rgba(0, 0, 0, 0.5)',
  color: '#ffffff',
};

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore clicks on the hamburger button itself, as its onClick handler will toggle the menu
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
      {/* Hamburger Button */}
      <button
        id="hamburger-btn"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2.5rem',
          background: isOpen ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(4px)',
          border: isOpen ? 'none' : '2px solid rgba(253, 250, 250, 1)',
          borderRadius: '8px',
          width: '40px',
          height: '38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          cursor: 'pointer',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ width: '20px', height: '2px', background: '#fff', transition: '0.3s', transform: isOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
        <div style={{ width: '20px', height: '2px', background: '#fff', transition: '0.3s', opacity: isOpen ? 0 : 1 }} />
        <div style={{ width: '20px', height: '2px', background: '#fff', transition: '0.3s', transform: isOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
      </button>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              ...glassmorphismStyle,
              padding: '6rem 2rem 2rem 2rem', // Top padding to clear hamburger
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <Link href="/" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.02, x: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  padding: '1rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                Translate
              </motion.div>
            </Link>
            
            <Link href="/flashcards" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.02, x: 10, backgroundColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  padding: '1rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                Flashcards
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
