import { X, Printer } from "lucide-react";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useChatbot } from "./Chatbotcontext";

export default function PastPaperModal({ subject, facultyCode, semester, onClose }) {
  const { askQuestion } = useChatbot();
  
  const paper = useMemo(() => {
    if (!subject || !subject.topics || subject.topics.length === 0) return null;

    const shuffled = [...subject.topics].sort(() => 0.5 - Math.random());
    
    const longTopics = shuffled.slice(0, 3);
    const shortTopics = shuffled.slice(3, 13);
    
    while (longTopics.length < 3) longTopics.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    while (shortTopics.length < 9) shortTopics.push(shuffled[Math.floor(Math.random() * shuffled.length)]);

    const longQuestions = longTopics.map((t, i) => {
      const templates = [
        `Explain the core concepts of ${t.title} in detail.`,
        `Discuss the significance and applications of ${t.title} with suitable examples.`,
        `Describe the mechanism behind ${t.title}. What are its major characteristics?`
      ];
      return { num: i + 1, text: templates[i % templates.length] };
    });

    const shortQuestions = shortTopics.map((t, i) => {
      const templates = [
        `Define ${t.title}.`,
        `Write short notes on ${t.title}.`,
        `What do you understand by ${t.title}?`,
        `Differentiate the key aspects of ${t.title}.`,
        `Briefly explain ${t.title}.`
      ];
      return { num: i + 4, text: templates[i % templates.length] };
    });

    return { longQuestions, shortQuestions };
  }, [subject]);

  const handleAskAI = (questionText, marks) => {
    const customTitle = `${subject.code} Q&A`;
    askQuestion(`Can you help me answer this past year exam question? Please answer in a way that is appropriate for a ${marks}-mark question.\n\n"${questionText}"`, customTitle);
  };

  if (!paper) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white w-full border border-gray-200 dark:border-gray-800 max-w-4xl max-h-full rounded-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111]">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Past Year Paper</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subject.title} ({subject.code})</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors rounded hover:bg-gray-200 dark:hover:bg-gray-800" title="Print Paper">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-12 print:p-0 print:overflow-visible bg-white dark:bg-[#0a0a0a] printable-paper print:bg-white print:text-black">
          <div className="max-w-3xl mx-auto" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            
            {/* IOST Header */}
            <div className="text-sm mb-6 flex justify-between items-start">
              <span>{subject.code}-2080&#10022;</span>
              <div className="text-center font-bold">
                <p>Tribhuvan University</p>
                <p>Institute of Science and Technology</p>
                <p>2080</p>
                <p>&#10022;</p>
              </div>
              <span className="w-16"></span> {/* Spacer for alignment */}
            </div>

            <div className="flex justify-between items-end text-sm mb-6 leading-relaxed">
              <div>
                <p>Bachelor Level / First Year / Semester {semester} / Science</p>
                <p><strong>Bachelor in {facultyCode === 'CSIT' ? 'Computer Science & IT' : 'Information Technology'} ({subject.code})</strong></p>
                <p className="italic">({subject.title})</p>
              </div>
              <div className="text-right">
                <p>Full Marks: 60</p>
                <p>Pass Marks: 24</p>
                <p>Time: 3 hours</p>
              </div>
            </div>

            <p className="text-sm italic mb-8 border-b border-gray-300 dark:border-gray-800 pb-4">
              Candidates are required to give their answers in their own words as far as practicable.<br/>
              The figures in the margin indicate full marks.
            </p>

            {/* Section A */}
            <div className="mb-10 text-[15px]">
              <h4 className="font-bold text-center underline text-lg mb-4">Section A</h4>
              <p className="font-bold mb-1">Long Answer Questions.</p>
              <div className="flex justify-between font-bold mb-6">
                <p>Attempt any TWO questions.</p>
                <p>(2&times;10=20)</p>
              </div>

              <div className="space-y-6">
                {paper.longQuestions.map(q => (
                  <div key={q.num} className="flex gap-4">
                    <span>{q.num}.</span>
                    <button 
                      onClick={() => handleAskAI(q.text, 10)}
                      className="flex-1 text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors print:no-underline print:text-black"
                    >
                      {q.text}
                    </button>
                    <span className="font-bold">(10)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B */}
            <div className="mb-10 text-[15px]">
              <h4 className="font-bold text-center underline text-lg mb-4">Section B</h4>
              <p className="font-bold mb-1">Short Answer Questions.</p>
              <div className="flex justify-between font-bold mb-6">
                <p>Attempt any EIGHT questions.</p>
                <p>(8&times;5=40)</p>
              </div>

              <div className="space-y-6">
                {paper.shortQuestions.map(q => (
                  <div key={q.num} className="flex gap-4">
                    <span>{q.num}.</span>
                    <button 
                      onClick={() => handleAskAI(q.text, 5)}
                      className="flex-1 text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors print:no-underline print:text-black"
                    >
                      {q.text}
                    </button>
                    <span className="font-bold">(5)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
