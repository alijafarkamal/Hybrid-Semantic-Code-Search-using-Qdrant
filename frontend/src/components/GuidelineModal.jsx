import React from 'react';
import Icons from './Icons';

const GuidelineModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050810]/90 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-[#0b0f1a] border border-blue-900/50 rounded-2xl shadow-[0_0_80px_rgba(37,99,235,0.15)] flex flex-col max-h-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Icons.BookOpen />
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">System Integration Guideline</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-8 overflow-y-auto custom-scrollbar text-slate-300">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Overview */}
            <section>
              <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                System Overview
              </h4>
              <p className="leading-relaxed text-sm bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                Hybrid Semantic Code Search is a locally-hosted AI search engine for your codebase. It uses <strong className="text-white">FastAPI</strong> on the backend, <strong className="text-white">React/Vite</strong> on the frontend, and <strong className="text-emerald-400">Qdrant</strong> (a local vector database) to perform hybrid searches combining semantic meaning with keyword matching.
              </p>
            </section>

            {/* Ingestion */}
            <section>
              <h4 className="text-lg font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                How Ingestion Works (<code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">ingest.py</code>)
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-slate-800 rounded text-slate-400"><Icons.Folder /></div>
                  <div>
                    <strong className="text-white">Intelligent Chunking:</strong>
                    <p className="mt-1 text-slate-400 leading-relaxed">When you provide an absolute path, the system reads your code files. For Python, it uses an Abstract Syntax Tree (AST) to chunk code intelligently by functions and classes. For other languages, it uses brace-matching heuristic chunking.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-slate-800 rounded text-slate-400"><Icons.Database /></div>
                  <div>
                    <strong className="text-white">Lightweight Embedding:</strong>
                    <p className="mt-1 text-slate-400 leading-relaxed">It converts each code chunk into a high-dimensional vector using the lightweight <code>BAAI/bge-small-en-v1.5</code> fastembed model (No heavy PyTorch required).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-slate-800 rounded text-slate-400"><Icons.Check /></div>
                  <div>
                    <strong className="text-white">Local Indexing:</strong>
                    <p className="mt-1 text-slate-400 leading-relaxed">These vectors are upserted into your local Qdrant database along with rich metadata (file path, line numbers, chunk type, signature, and docstrings).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Search */}
            <section>
              <h4 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                How Search Works (<code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">search.py</code>)
              </h4>
              <ul className="space-y-3 text-sm list-disc list-inside text-slate-400 ml-2">
                <li><strong className="text-white">Semantic Search:</strong> Your natural language query is converted into a vector and compared against the code vectors in Qdrant using Cosine Similarity.</li>
                <li><strong className="text-white">Lexical Re-ranking:</strong> A local TF-IDF algorithm boosts the score of chunks that have exact keyword matches (like specific variable names).</li>
                <li><strong className="text-white">Hybrid Fusion:</strong> The final score is a weighted combination of semantic meaning (70% by default) and exact matches (30% by default).</li>
              </ul>
            </section>

            {/* AI Planning */}
            <section>
              <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                How AI Planning Works (<code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">reasoning.py</code>)
              </h4>
              <p className="leading-relaxed text-sm bg-purple-500/5 p-4 rounded-xl border border-purple-500/20">
                If you use the <strong>"Generate Change Plan"</strong> feature, the system sends the top search results along with your prompt to <strong className="text-purple-300">Google Gemini</strong>. Gemini then analyzes the code snippets contextually and generates a step-by-step implementation plan to help you integrate new features or fix bugs efficiently.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidelineModal;
