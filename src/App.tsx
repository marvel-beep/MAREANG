import React, { useState, useEffect, useRef } from 'react';
import { Camera, History, ArrowLeft, X, Save, Share2, Loader2, Trash2, Moon, Sun, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { solveMathProblem } from './services/gemini';
import { HistoryItem, AppState } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentResult, setCurrentResult] = useState<Partial<HistoryItem> | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleCapture = async (base64Image: string) => {
    setIsLoading(true);
    setState('loading');
    try {
      const result = await solveMathProblem(base64Image);
      setCurrentResult(result);
      setState('result');
    } catch (err) {
      console.error('Failed to solve', err);
      alert('Failed to analyze image. Please try again.');
      setState('camera');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = async () => {
    if (!currentResult) return;
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentResult),
      });
      fetchHistory();
      alert('Saved to history!');
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const shareResult = () => {
    if (!currentResult) return;
    const text = `Math Problem: ${currentResult.expression}\nResult: ${currentResult.result}\n\nSolved with CALLCAM`;
    if (navigator.share) {
      navigator.share({ title: 'CALLCAM Result', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-bottom border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic">C</div>
          <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">CALLCAM</h1>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {state === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20">
                <h2 className="text-2xl font-bold mb-2">Smart Math Solver</h2>
                <p className="text-blue-100 mb-6">Snap a photo and get instant step-by-step solutions.</p>
                <button 
                  onClick={() => setState('camera')}
                  className="w-full bg-white text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg"
                >
                  <Camera size={24} />
                  Open Camera
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <History size={20} className="text-blue-600" />
                    Recent History
                  </h3>
                  {history.length > 0 && (
                    <span className="text-xs text-slate-500">{history.length} items</span>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <p className="text-slate-400">No history yet. Start solving!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setCurrentResult(item);
                          setState('result');
                        }}
                        className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-mono text-sm truncate">{item.expression}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">{item.result}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                          <ChevronRight size={20} className="text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {state === 'camera' && (
            <CameraView 
              onCapture={handleCapture} 
              onBack={() => setState('home')} 
            />
          )}

          {state === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="relative">
                <Loader2 size={64} className="text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Analyzing Problem...</h3>
                <p className="text-slate-500">Gemini is working its magic</p>
              </div>
            </motion.div>
          )}

          {state === 'result' && currentResult && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setState('home')}
                  className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={saveToHistory}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Save size={20} />
                  </button>
                  <button 
                    onClick={shareResult}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg mb-2 inline-block">
                    {currentResult.category}
                  </span>
                  <h3 className="text-sm text-slate-500 mb-1">Problem</h3>
                  <p className="text-xl font-mono leading-relaxed">{currentResult.expression}</p>
                </div>

                <div className="p-4 bg-blue-600 rounded-2xl text-white mb-8">
                  <h3 className="text-xs text-blue-200 mb-1 uppercase tracking-widest font-bold">Final Result</h3>
                  <p className="text-3xl font-bold">{currentResult.result}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    Step-by-Step Solution
                  </h3>
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:rounded-xl">
                    <ReactMarkdown>{currentResult.steps || ''}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {state === 'home' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
           <button 
            onClick={() => setState('camera')}
            className="bg-blue-600 text-white p-5 rounded-full shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all"
          >
            <Camera size={32} />
          </button>
        </div>
      )}
    </div>
  );
}

function CameraView({ onCapture, onBack }: { onCapture: (img: string) => void, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser doesn't support camera access.");
        return;
      }

      try {
        // Try back camera first
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      } catch (err) {
        console.warn('Back camera failed, trying any camera...', err);
        try {
          // Fallback to any camera
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsReady(true);
          }
        } catch (err2: any) {
          console.error('All camera access failed', err2);
          setError(err2.message || "Camera access denied. Please check your permissions.");
        }
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64);
      }
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onBack} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-white font-bold">Scan Problem</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="p-8 text-center text-white space-y-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h3 className="text-xl font-bold">Camera Error</h3>
            <p className="text-slate-400 max-w-xs mx-auto">{error}</p>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={openInNewTab}
                className="bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Open in New Tab
              </button>
              <button 
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-white/50 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {!error && (
        <div className="p-8 bg-black flex items-center justify-center">
          <button 
            onClick={capture}
            disabled={!isReady}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
