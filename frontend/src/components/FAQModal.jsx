import { useState } from 'react';
import Icons from './Icons';
import GuidelineModal from './GuidelineModal';

const faqs = [
  {
    question: 'What is Hybrid Semantic Code Search?',
    answer: 'Hybrid Semantic Code Search combines traditional keyword search with advanced semantic vector search. It understands the context and intent of your query, allowing you to find code snippets even if you do not use the exact keywords.',
  },
  {
    question: 'How do I connect my codebase?',
    answer: 'Navigate to the "Ingestion" tab from the sidebar. Enter the absolute path of your local directory containing your code. The system will automatically chunk, embed, and index your code into the Qdrant database.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes! All code ingestion and searching happen locally on your machine. Your codebase is not uploaded to any external servers, ensuring complete privacy and security.',
  },
  {
    question: 'What is the "Semantic Weight" setting?',
    answer: 'Semantic Weight (from 0 to 1) determines the balance between exact keyword matching and semantic meaning. A higher weight focuses more on meaning, while a lower weight focuses strictly on exact text matches.',
  },
  {
    question: 'Why do I need Qdrant?',
    answer: 'Qdrant is an open-source vector database. We use it to store the vector embeddings of your code chunks, which makes ultra-fast semantic similarity searches possible.',
  }
];

const FAQModal = ({ isOpen, onClose }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);

  if (!isOpen) return null;

  const toggleFAQ = (index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0b0f1a]/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#111827] border border-slate-700/50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col max-h-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Icons.Help />
            </div>
            <h3 className="text-xl font-bold text-white">Frequently Asked Questions</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div 
                  key={index} 
                  className={`border rounded-xl transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-slate-800 bg-slate-800/20 hover:border-slate-700 hover:bg-slate-800/40'}`}
                >
                  <button 
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                  >
                    <span className={`font-semibold transition-colors ${isExpanded ? 'text-blue-400' : 'text-slate-200'}`}>
                      {faq.question}
                    </span>
                    <span className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Guideline Button */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center justify-center">
            <p className="text-sm text-slate-400 mb-4 text-center">Need more detailed instructions?</p>
            <button 
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95"
              onClick={() => setIsGuidelineModalOpen(true)}
            >
              <span><Icons.BookOpen /></span>
              Full Guideline: How to integrate with the system
            </button>
          </div>
        </div>

      </div>

      <GuidelineModal 
        isOpen={isGuidelineModalOpen} 
        onClose={() => setIsGuidelineModalOpen(false)} 
      />
    </div>
  );
};

export default FAQModal;
