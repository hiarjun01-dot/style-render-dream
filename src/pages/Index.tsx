import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { PreviewPanel } from '@/components/PreviewPanel';
import { useToast } from '@/hooks/use-toast';
import { Code2, Palette, Zap } from 'lucide-react';

const Index = () => {
  // Initial state moved to the parent component
  const [html, setHtml] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Creation</title>
</head>
<body>
    <div class="container">
        <h1>Welcome to Your HTML/CSS Playground</h1>
        <p>Start editing the code to see your creation come to life!</p>
        <div class="card">
            <h2>Beautiful Card Component</h2>
            <p>This is a sample card with modern styling.</p>
            <button class="btn">Click Me</button>
        </div>
    </div>
</body>
</html>`);

  const [css, setCss] = useState(`/* Modern CSS Styles */
body {
    margin: 0;
    padding: 20px;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: white;
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
    color: white;
    text-align: center;
    font-size: 1.2rem;
    margin-bottom: 30px;
}

.card {
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    margin: 20px 0;
    transform: translateY(0);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}

.card h2 {
    color: #4a5568;
    margin-bottom: 15px;
}

.card p {
    color: #718096;
    text-align: left;
    margin-bottom: 20px;
}

.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}`);

  const { toast } = useToast();

  const handleCodeChange = (newHtml: string, newCss: string) => {
    setHtml(newHtml);
    setCss(newCss);
  };

  const handleDownload = () => {
    let downloadableHtml = html;

    // If the HTML input is a fragment (lacks a <head>), wrap it in a full document structure.
    if (!/<\/head>/i.test(html)) {
      downloadableHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloaded Creation</title>
</head>
<body>
  ${html}
</body>
</html>`;
    }

    // Reliably inject the CSS just before the closing </head> tag.
    const finalHtml = downloadableHtml.replace(/<\/head>/i, `<style>${css}</style></head>`);

    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started!",
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
              initialHtml={html}
              initialCss={css}
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
    </div>
  );
};

export default Index;
