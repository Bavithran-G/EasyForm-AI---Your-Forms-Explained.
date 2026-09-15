import { Home } from './pages/Home';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeSwitch } from './components/ui/ThemeSwitch';

export function App() {
  return (
    <ThemeProvider>
      <div className="w-full min-h-screen bg-[#F0FAF6] dark:bg-[#111214] text-[#2E2E2E] dark:text-[#FFFFFF] overflow-x-hidden selection:bg-[#2EB688]/30 selection:text-[#111214] dark:selection:text-[#CEF1E4] transition-colors duration-300">
        <Home />

        {/* Floating Corner Theme Switch (Fixed in bottom-right corner) */}
        <ThemeSwitch variant="floating" />
      </div>
    </ThemeProvider>
  );
}

export default App;

