import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Button } from '@/components/ui/button';
import { Code2, Palette, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const { toast } = useToast();

  const handleCodeChange = (newHtml: string, newCss: string) => {
    setHtml(newHtml);
    setCss(newCss);
  };

  const handleDownload = () => {
    // Create a complete HTML file with embedded CSS
    const fullHtml = html.includes('<style>') || html.includes('<link') 
      ? html 
      : html.replace(
          '<head>',
          `<head>
            <style>${css}</style>`
        );

    // Create and download the file
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-webpage.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download successful!",
      description: "Your HTML file has been downloaded with embedded CSS.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  HTML/CSS Processor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create, edit, and preview your web designs in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Live Preview</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Instant Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 h-[calc(100vh-88px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Code Editor Panel */}
          <div className="animate-fade-in">
            <CodeEditor 
              onCodeChange={handleCodeChange}
              onDownload={handleDownload}
            />
          </div>

          {/* Preview Panel */}
          <div className="animate-slide-in-right">
            <PreviewPanel 
              html={html}
              css={css}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Built with modern web technologies</p>
            <p>Real-time HTML/CSS processing</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
