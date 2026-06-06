export default function ThemeFooter() {
  return (
    <footer className="w-full max-w-5xl mx-auto mt-16 pb-8 px-4 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 font-sans" id="app-footer">
      <p>© 2026 AI Interview Coach. Built with state-of-the-art predictive evaluation metrics.</p>
      <div className="flex justify-center gap-4 mt-2">
        <span className="hover:text-slate-600 cursor-help transition-colors">STAR Methodology</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-help transition-colors">Behavioral, Technical & Mixed Modalities</span>
        <span>•</span>
        <span className="hover:text-slate-600 cursor-help transition-colors">Automatic Performance Adaptation</span>
      </div>
    </footer>
  );
}
