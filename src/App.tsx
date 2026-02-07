import React, { useState } from 'react';
import Graph from './components/Graph';
import Sidebar from './components/Sidebar';
import { Language, LayoutName, Stats } from './types';
import { Menu } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [layout, setLayout] = useState<LayoutName>('fcose');
  const [stats, setStats] = useState<Stats | null>(null); // Kept for future use or passed to sidebar
  const [totalNodes, setTotalNodes] = useState(0);
  const [avgConnections, setAvgConnections] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleStatsUpdate = (total: number, avg: number) => {
    setTotalNodes(total);
    setAvgConnections(avg);
  };

  const handleReset = () => {
    setResetTrigger(prev => prev + 1);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50">
      {/* Graph Area - Full Screen */}
      <div className="absolute inset-0 z-0">
        <Graph
          language={language}
          layoutName={layout}
          onLayoutChange={setLayout}
          onStatsUpdate={handleStatsUpdate}
          resetTrigger={resetTrigger}
        />
      </div>

      {/* Menu Button (Mobile / When Sidebar Closed) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`absolute top-4 right-4 z-20 p-3 bg-white/90 backdrop-blur-md shadow-lg rounded-full text-slate-600 hover:text-indigo-600 transition-all duration-300 hover:scale-105 border border-white/50 ${
          isSidebarOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
        }`}
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar - Floating / Drawer */}
      <Sidebar
        language={language}
        setLanguage={setLanguage}
        layout={layout}
        setLayout={setLayout}
        stats={stats}
        totalNodes={totalNodes}
        avgConnections={avgConnections}
        onReset={handleReset}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}

export default App;
