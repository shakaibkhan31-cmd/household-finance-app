'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Calculator, X, Delete, PlusCircle } from 'lucide-react';

export default function Header() {
  const [currentDateTime, setCurrentDateTime] = useState<{ dateStr: string; dayStr: string }>({ dateStr: '', dayStr: '' });
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcInput, setCalcInput] = useState('0');

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    setCurrentDateTime({ dateStr, dayStr });
  }, []);

  // Calculator Logic Handlers
  const handleCalcClick = (val: string) => {
    if (calcInput === '0' && val !== '.') {
      setCalcInput(val);
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const clearCalculator = () => {
    setCalcInput('0');
  };

  const calculateResult = () => {
    try {
      const sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
      const result = eval(sanitized);
      setCalcInput(String(result));
    } catch (err) {
      setCalcInput('Error');
    }
  };

  const deleteLastChar = () => {
    setCalcInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Live Date & Day */}
      <div className="flex items-center gap-2.5 text-slate-700">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">{currentDateTime.dateStr || 'Loading Date...'}</p>
          <p className="text-[11px] text-slate-400 font-medium">Household Financial Control Centre</p>
        </div>
      </div>

      {/* Right: Quick Action & Calculator */}
      <div className="flex items-center gap-3">
        {/* Quick Shortcut Button */}
        <Link
          href="/transactions"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          title="Quickly record new transaction"
        >
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          <span>New Entry</span>
        </Link>

        {/* Built-in Calculator Trigger & Modal */}
        <div className="relative">
          <button
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculator</span>
          </button>

          {/* Floating Calculator Modal / Dropdown */}
          {isCalculatorOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Quick Calculator
                </span>
                <button 
                  onClick={() => setIsCalculatorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Display Screen */}
              <div className="bg-slate-900 text-white p-3 rounded-xl text-right font-mono text-lg font-bold tracking-wider overflow-x-auto">
                {calcInput}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <button onClick={clearCalculator} className="p-2.5 bg-rose-50 text-rose-600 font-bold rounded-lg hover:bg-rose-100 col-span-2">AC</button>
                <button onClick={deleteLastChar} className="p-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 flex items-center justify-center"><Delete className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleCalcClick('÷')} className="p-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100">÷</button>

                <button onClick={() => handleCalcClick('7')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">7</button>
                <button onClick={() => handleCalcClick('8')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">8</button>
                <button onClick={() => handleCalcClick('9')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">9</button>
                <button onClick={() => handleCalcClick('*')} className="p-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100">×</button>

                <button onClick={() => handleCalcClick('4')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">4</button>
                <button onClick={() => handleCalcClick('5')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">5</button>
                <button onClick={() => handleCalcClick('6')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">6</button>
                <button onClick={() => handleCalcClick('-')} className="p-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100">-</button>

                <button onClick={() => handleCalcClick('1')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">1</button>
                <button onClick={() => handleCalcClick('2')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">2</button>
                <button onClick={() => handleCalcClick('3')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">3</button>
                <button onClick={() => handleCalcClick('+')} className="p-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100">+</button>

                <button onClick={() => handleCalcClick('0')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100 col-span-2">0</button>
                <button onClick={() => handleCalcClick('.')} className="p-2.5 bg-slate-50 text-slate-800 font-semibold rounded-lg hover:bg-slate-100">.</button>
                <button onClick={calculateResult} className="p-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">=</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}