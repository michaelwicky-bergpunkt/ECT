/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ThumbsUp, Info, ChevronRight, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';

type PropagationType = 'glatt' | 'partiell' | 'nicht';

interface WheelPickerProps {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ value, onChange, min, max }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 50;
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const newValue = items[index];
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    if (containerRef.current && value !== null) {
      const index = items.indexOf(value);
      const targetScroll = index * itemHeight;
      if (Math.abs(containerRef.current.scrollTop - targetScroll) > 1) {
        containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [value]);

  const getItemColor = (val: number) => {
    if (val <= 11) return 'text-red-500';
    if (val <= 22) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getBgColor = (val: number | null) => {
    if (val === null) return 'bg-white';
    if (val <= 11) return 'bg-red-50';
    if (val <= 22) return 'bg-yellow-50';
    return 'bg-emerald-50';
  };

  return (
    <div className="relative h-[150px] w-20 flex items-center justify-center bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
      {/* Range Color Bar */}
      <div className="absolute left-0 top-0 w-1 h-full flex flex-col opacity-30">
        <div className="bg-red-500" style={{ height: '37.5%' }} />
        <div className="bg-yellow-400" style={{ height: '34.4%' }} />
        <div className="bg-emerald-500" style={{ height: '28.1%' }} />
      </div>

      {/* Selection Highlight */}
      <motion.div 
        animate={{ backgroundColor: value !== null ? (value <= 11 ? '#fef2f2' : value <= 22 ? '#fefce8' : '#ecfdf5') : '#ffffff' }}
        className="absolute top-1/2 left-0 w-full h-[50px] -translate-y-1/2 shadow-sm border-y border-slate-200 pointer-events-none z-0" 
      />
      
      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-slate-50/80 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-50/80 to-transparent pointer-events-none z-20" />

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar z-10 py-[50px]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const isSelected = item === value;
          const distance = value !== null ? Math.abs(item - value) : 999;
          const isAdjacent = distance === 1;
          
          return (
            <div 
              key={item}
              className="h-[50px] flex items-center justify-center snap-center"
            >
              <motion.span
                animate={{ 
                  scale: isSelected ? 1.5 : (isAdjacent ? 1.2 : 1),
                  opacity: isSelected ? 1 : (isAdjacent ? 1 : 0.4),
                  fontWeight: isSelected ? 900 : (isAdjacent ? 800 : 500)
                }}
                className={`transition-colors duration-200 ${isSelected ? getItemColor(item) : (isAdjacent ? 'text-slate-700' : 'text-slate-400')}`}
              >
                {item}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [taps, setTaps] = useState<number | null>(null);
  const [propagation, setPropagation] = useState<PropagationType | null>(null);

  // Logic for Initiation Thumb
  const initiationValue = useMemo(() => {
    if (taps === null) return null;
    if (taps <= 11) return -1; // Down
    if (taps <= 22) return 0;  // Sideways
    return 1;                  // Up
  }, [taps]);

  const initiationRotation = useMemo(() => {
    if (initiationValue === -1) return 180; // Down
    if (initiationValue === 0) return 90;   // Sideways
    return 0;                               // Up
  }, [initiationValue]);

  const initiationColor = useMemo(() => {
    if (taps === null) return 'text-slate-300';
    if (taps <= 11) return 'text-red-500';
    if (taps <= 22) return 'text-yellow-500';
    return 'text-emerald-500';
  }, [taps]);

  // Logic for Propagation Thumb
  const propagationValue = useMemo(() => {
    if (propagation === null) return null;
    if (propagation === 'glatt') return -1;
    if (propagation === 'partiell') return 0;
    return 1;
  }, [propagation]);

  const propagationRotation = useMemo(() => {
    if (propagationValue === -1) return 180;
    if (propagationValue === 0) return 90;
    return 0;
  }, [propagationValue]);

  const propagationColor = useMemo(() => {
    if (propagation === 'glatt') return 'text-red-500';
    if (propagation === 'partiell') return 'text-yellow-500';
    if (propagation === 'nicht') return 'text-emerald-500';
    return 'text-slate-300';
  }, [propagation]);

  // Result Logic
  const totalScore = useMemo(() => {
    if (initiationValue === null || propagationValue === null) return null;
    return initiationValue + propagationValue;
  }, [initiationValue, propagationValue]);

  const stabilityInfo = useMemo(() => {
    if (totalScore === null) return null;

    // Calculate rotation based on user's specific logic
    let resultRotation = 0;
    const iRot = initiationRotation;
    const pRot = propagationRotation;

    if (iRot === 0 && pRot === 0) {
      resultRotation = 0;
    } else if ((iRot === 0 && pRot === 90) || (iRot === 90 && pRot === 0)) {
      resultRotation = 40;
    } else if ((iRot === 90 && pRot === 90) || (iRot === 0 && pRot === 180) || (iRot === 180 && pRot === 0)) {
      resultRotation = 80;
    } else if ((iRot === 90 && pRot === 180) || (iRot === 180 && pRot === 90)) {
      resultRotation = 125;
    } else if (iRot === 180 && pRot === 180) {
      resultRotation = 180;
    }

    if (totalScore >= 1) {
      return {
        label: 'gut',
        color: '#8cc63f',
        textColor: 'text-[#5a8228]',
        rotation: resultRotation,
        description: 'keine Auslösung'
      };
    } else if (totalScore === 0) {
      return {
        label: 'mittel',
        color: '#fff200',
        textColor: 'text-[#8a8200]',
        rotation: resultRotation,
        description: 'Auslösung durch grosse Zusatzbelastung'
      };
    } else if (totalScore === -1) {
      return {
        label: 'schlecht',
        color: '#f7941d',
        textColor: 'text-[#a35e0d]',
        rotation: resultRotation,
        description: 'Auslösung durch geringe Zusatzbelastung'
      };
    } else {
      return {
        label: 'sehr schlecht',
        color: '#ed1c24',
        textColor: 'text-[#9e1218]',
        rotation: resultRotation,
        description: 'Selbstauslösung'
      };
    }
  }, [totalScore, initiationRotation, propagationRotation]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">ECT Visualizer</h1>
          <p className="text-xs text-slate-400 font-bold">
            powered by <a href="https://bergpunkt.ch/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">bergpunkt</a>
          </p>
        </div>
        <a 
          href="https://lawinenwarndienst.bayern.de/lawine-daumenmethode-einzelhang-schneedeckenstabilitaet-schneedeckentest-ect-kbt/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Info size={18} className="text-slate-400" />
        </a>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Initiation Section */}
          <section className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-800">Bruchinitiierung</h2>
              <p className="text-xs text-slate-400 font-medium">Anzahl Schläge bis zum Bruch</p>
            </div>

            <div className="flex items-center justify-center gap-12">
              <WheelPicker 
                value={taps} 
                onChange={setTaps} 
                min={0} 
                max={31} 
              />
              
              <div className="flex flex-col items-center gap-3">
                <motion.div 
                  animate={{ rotate: initiationRotation }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner"
                >
                  <ThumbsUp size={56} className={initiationColor} />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Propagation Section */}
          <section className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-800">Bruchfortpflanzung</h2>
              <p className="text-xs text-slate-400 font-medium">Wie pflanzt sich der Bruch fort?</p>
            </div>

            <div className="flex items-center justify-center gap-12">
              <div className="flex flex-col gap-2 w-20">
                <button 
                  onClick={() => setPropagation('glatt')}
                  className={`group flex flex-col items-center justify-center py-2 px-2 rounded-xl border-2 transition-all duration-300 ${
                    propagation === 'glatt' 
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-100' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="font-black text-xs">ECTP</span>
                </button>
                <button 
                  onClick={() => setPropagation('partiell')}
                  className={`group flex flex-col items-center justify-center py-2 px-2 rounded-xl border-2 transition-all duration-300 ${
                    propagation === 'partiell' 
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-md shadow-yellow-100' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="font-black text-xs">ECTpp</span>
                </button>
                <button 
                  onClick={() => setPropagation('nicht')}
                  className={`group flex flex-col items-center justify-center py-2 px-2 rounded-xl border-2 transition-all duration-300 ${
                    propagation === 'nicht' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="font-black text-xs">ECTN</span>
                </button>
              </div>

              <div className="flex flex-col items-center gap-3">
                <motion.div 
                  animate={{ rotate: propagationRotation }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner"
                >
                  <ThumbsUp size={56} className={propagationColor} />
                </motion.div>
              </div>
            </div>

            <div className="h-4 mt-4 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {propagation && (
                  <motion.p 
                    key={propagation}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${propagationColor}`}
                  >
                    {propagation === 'glatt' && 'Glatte Bruchfläche'}
                    {propagation === 'partiell' && 'Raue Bruchfläche'}
                    {propagation === 'nicht' && 'Keine Bruchfortpflanzung'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>

        {/* Result Section */}
        <div className="lg:col-span-5">
          <section className="bg-white text-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 sticky top-8 flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="mb-8">
              <h2 className="text-lg font-black text-slate-800">Stabilitätsklasse</h2>
            </div>
            
            {stabilityInfo ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-80 h-80 mb-4 flex items-center justify-center">
                  {/* Gauge SVG */}
                  <svg width="320" height="320" viewBox="0 0 200 200" className="absolute overflow-visible">
                    <defs>
                      {/* Paths for text alignment - adjusted for precise centering in sectors */}
                      {/* gut: -10 to 45 */}
                      <path id="path-gut" d="M 87.00 26.00 A 75 75 0 0 1 153.03 46.97" />
                      {/* mittel: 45 to 100 */}
                      <path id="path-mittel" d="M 153.03 46.97 A 75 75 0 0 1 173.86 113.02" />
                      {/* schlecht: 100 to 145 */}
                      <path id="path-schlecht" d="M 173.86 113.02 A 75 75 0 0 1 143.02 161.43" />
                      {/* sehr schlecht: 145 to 190 - stacked on two paths for readability */}
                      <path id="path-sehr" d="M 140.15 157.34 A 70 70 0 0 1 87.85 168.94" />
                      <path id="path-schlecht-arc" d="M 147.03 167.17 A 82 82 0 0 1 85.76 180.75" />
                      
                      <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Continuous Arc Sectors */}
                    {/* Gut Sector: -10 to 45 */}
                    <path 
                      d="M 84.37 11.19 A 90 90 0 0 1 163.64 36.36 L 142.43 57.57 A 60 60 0 0 0 89.58 40.79 Z" 
                      fill="#8cc63f" 
                      className={`transition-all duration-500 ${totalScore! >= 1 ? 'opacity-100' : 'opacity-20'}`}
                      style={{ 
                        filter: totalScore! >= 1 ? 'url(#activeGlow)' : 'none',
                        transform: totalScore! >= 1 ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                    <text className="text-[11px] font-black fill-[#2d4014] lowercase pointer-events-none">
                      <textPath href="#path-gut" startOffset="50%" textAnchor="middle">gut</textPath>
                    </text>

                    {/* Mittel Sector: 45 to 100 */}
                    <path 
                      d="M 163.64 36.36 A 90 90 0 0 1 188.63 115.63 L 159.09 110.42 A 60 60 0 0 0 142.43 57.57 Z" 
                      fill="#fff200" 
                      className={`transition-all duration-500 ${totalScore === 0 ? 'opacity-100' : 'opacity-20'}`}
                      style={{ 
                        filter: totalScore === 0 ? 'url(#activeGlow)' : 'none',
                        transform: totalScore === 0 ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                    <text className="text-[11px] font-black fill-[#5c5700] lowercase pointer-events-none">
                      <textPath href="#path-mittel" startOffset="50%" textAnchor="middle">mittel</textPath>
                    </text>

                    {/* Schlecht Sector: 100 to 145 */}
                    <path 
                      d="M 188.63 115.63 A 90 90 0 0 1 151.62 173.72 L 134.41 149.15 A 60 60 0 0 0 159.09 110.42 Z" 
                      fill="#f7941d" 
                      className={`transition-all duration-500 ${totalScore === -1 ? 'opacity-100' : 'opacity-20'}`}
                      style={{ 
                        filter: totalScore === -1 ? 'url(#activeGlow)' : 'none',
                        transform: totalScore === -1 ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                    <text className="text-[11px] font-black fill-[#6b400b] lowercase pointer-events-none">
                      <textPath href="#path-schlecht" startOffset="50%" textAnchor="middle">schlecht</textPath>
                    </text>

                    {/* Sehr Schlecht Sector: 145 to 190 */}
                    <path 
                      d="M 151.62 173.72 A 90 90 0 0 1 84.37 188.63 L 89.58 159.21 A 60 60 0 0 0 134.41 149.15 Z" 
                      fill="#ed1c24" 
                      className={`transition-all duration-500 ${totalScore! <= -2 ? 'opacity-100' : 'opacity-20'}`}
                      style={{ 
                        filter: totalScore! <= -2 ? 'url(#activeGlow)' : 'none',
                        transform: totalScore! <= -2 ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                    <text className="text-[9px] font-black fill-[#6b0c10] lowercase pointer-events-none">
                      <textPath href="#path-sehr" startOffset="50%" textAnchor="middle">sehr</textPath>
                    </text>
                    <text className="text-[9px] font-black fill-[#6b0c10] lowercase pointer-events-none">
                      <textPath href="#path-schlecht-arc" startOffset="50%" textAnchor="middle">schlecht</textPath>
                    </text>
                  </svg>

                  {/* Result Thumb - Centered and Rotating */}
                  <motion.div 
                    className="absolute flex items-center justify-center"
                    animate={{ 
                      rotate: stabilityInfo.rotation, 
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 12 }}
                  >
                    <div 
                      className="p-8 bg-white rounded-full shadow-2xl border border-slate-100 relative group"
                      style={{ color: stabilityInfo.color }}
                    >
                      <ThumbsUp size={72} className="transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={stabilityInfo.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10"
                  >
                    <div 
                      className="inline-block px-4 py-1 rounded-full mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                      style={{ backgroundColor: stabilityInfo.color }}
                    >
                      {stabilityInfo.label}
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
                      {stabilityInfo.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-200 py-12">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center mb-6">
                  <AlertTriangle size={40} className="opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Werte wählen</p>
                <p className="text-[10px] text-slate-300 mt-2 max-w-[180px]">Wähle Schläge und Fortpflanzung für das Resultat</p>
              </div>
            )}
          </section>
        </div>
      </main>
      
      <footer className="max-w-5xl mx-auto mt-12 pb-8 text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">© 2026 bergpunkt · ECT Visualizer v2.0</p>
      </footer>
    </div>
  );
}
