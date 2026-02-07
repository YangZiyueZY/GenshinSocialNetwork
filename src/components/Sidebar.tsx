import React from 'react';
import { LayoutName, Language, Stats } from '../types';
import { Github, Info, X, Settings2, Share2, BarChart3, Layout } from 'lucide-react';

interface SidebarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  layout: LayoutName;
  setLayout: (layout: LayoutName) => void;
  stats: Stats | null;
  totalNodes: number;
  avgConnections: number;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  language,
  setLanguage,
  layout,
  setLayout,
  totalNodes,
  avgConnections,
  onReset,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-2xl z-30 transform transition-transform duration-300 ease-out border-l border-white/50 flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          md:top-4 md:right-4 md:h-[calc(100vh-2rem)] md:rounded-2xl md:border md:border-white/60
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60 bg-white/50 md:rounded-t-2xl">
          <div className="flex items-center gap-2 text-slate-800">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold tracking-tight">
              {language === 'zh' ? '原神人物网络' : 'Genshin Network'}
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-5 space-y-8">
          
          {/* Language Switch */}
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex shadow-inner">
             <button
              onClick={() => setLanguage('zh')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                language === 'zh' 
                  ? "bg-white text-indigo-600 shadow-sm scale-100" 
                  : "text-slate-500 hover:text-slate-700 scale-95 hover:scale-100"
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                language === 'en' 
                  ? "bg-white text-indigo-600 shadow-sm scale-100" 
                  : "text-slate-500 hover:text-slate-700 scale-95 hover:scale-100"
              }`}
            >
              English
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900 leading-relaxed shadow-sm">
            <div className="flex gap-3">
              <Info className="w-5 h-5 flex-shrink-0 text-indigo-500 mt-0.5" />
              <p className="opacity-90">
                {language === 'zh'
                  ? '点击头像选中，悬停连线查看语音。人物可拖动。'
                  : 'Click icon to select. Hover edges to show quotes. Drag to move.'}
              </p>
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2">
              <Layout className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm uppercase tracking-wider">
                {language === 'zh' ? '布局模式' : 'Layout Mode'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'fcose', zh: '力导向 (Force)', en: 'Force-directed' },
                { id: 'avsdf', zh: '圆周 (Circle)', en: 'Circle Layout' },
                { id: 'concentric', zh: '同心圆 (Focus)', en: 'Concentric' }
              ].map((opt) => (
                <label 
                  key={opt.id}
                  className={`relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    layout === opt.id || (opt.id === 'concentric' && layout === 'concentricCustom')
                      ? "bg-indigo-50/50 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20" 
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="layout"
                    value={opt.id}
                    checked={layout === opt.id || (opt.id === 'concentric' && layout === 'concentricCustom')}
                    onChange={() => setLayout(opt.id as LayoutName)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mr-3"
                  />
                  <span className={`text-sm font-medium ${
                    layout === opt.id || (opt.id === 'concentric' && layout === 'concentricCustom')
                      ? "text-indigo-900" 
                      : "text-slate-600"
                  }`}>
                    {language === 'zh' ? opt.zh : opt.en}
                  </span>
                </label>
              ))}
            </div>
            
            <button
              onClick={onReset}
              className="w-full mt-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-sm font-semibold shadow-sm flex items-center justify-center gap-2 group"
            >
              <Settings2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              {language === 'zh' ? '重置视图' : 'Reset View'}
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm uppercase tracking-wider">
                {language === 'zh' ? '数据统计' : 'Statistics'}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-slate-800 tabular-nums">{totalNodes}</span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  {language === 'zh' ? '角色' : 'Nodes'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1">
                <span className="text-2xl font-bold text-slate-800 tabular-nums">{avgConnections}</span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                  {language === 'zh' ? '平均连接' : 'Avg Edges'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 md:rounded-b-2xl text-xs text-slate-400 flex flex-col items-center gap-3">
          <a
            href="https://github.com/King-of-Infinite-Space/genshin-social-network"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100"
          >
            <Github size={16} />
            <span className="font-medium">GitHub</span>
          </a>
          <div className="text-center opacity-70 scale-90">
            <p>{language === 'zh' ? '仅用于研究目的' : 'For research purpose only'}</p>
            <p className="mt-0.5">
              {language === 'zh' ? '游戏数据' : 'Game data'} © miHoYo
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
