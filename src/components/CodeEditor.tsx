import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Download, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  onCodeChange: (html: string, css: string) => void;
  onDownload: () => void;
}

export function CodeEditor({ onCodeChange, onDownload }: CodeEditorProps) {
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

  const handleHtmlChange = (value: string) => {
    setHtml(value);
    onCodeChange(value, css);
  };

  const handleCssChange = (value: string) => {
    setCss(value);
    onCodeChange(html, value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'html' | 'css') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'html') {
        setHtml(content);
        onCodeChange(content, css);
      } else {
        setCss(content);
        onCodeChange(html, content);
      }
      toast({
        title: "File uploaded successfully",
        description: `${type.toUpperCase()} file has been loaded into the editor.`,
      });
    };
    reader.readAsText(file);
  };

  const clearCode = () => {
    setHtml('');
    setCss('');
    onCodeChange('', '');
    toast({
      title: "Code cleared",
      description: "Both HTML and CSS editors have been cleared.",
    });
  };

  const runCode = () => {
    onCodeChange(html, css);
    toast({
      title: "Code executed",
      description: "Your changes have been applied to the preview.",
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Code Editor</h2>
        <div className="flex gap-2">
          <Button
            onClick={runCode}
            size="sm"
            className="glow-button text-primary-foreground"
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button
            onClick={clearCode}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            onClick={onDownload}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* HTML Editor */}
      <Card className="card-gradient flex-1">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-card-foreground flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              HTML
            </label>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => handleFileUpload(e, 'html')}
                  className="hidden"
                />
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                  </span>
                </Button>
              </label>
            </div>
          </div>
          <Textarea
            value={html}
            onChange={(e) => handleHtmlChange(e.target.value)}
            className="code-editor flex-1 resize-none font-mono text-xs"
            placeholder="Enter your HTML code here..."
          />
        </div>
      </Card>

      {/* CSS Editor */}
      <Card className="card-gradient flex-1">
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-card-foreground flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              CSS
            </label>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".css"
                  onChange={(e) => handleFileUpload(e, 'css')}
                  className="hidden"
                />
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                  </span>
                </Button>
              </label>
            </div>
          </div>
          <Textarea
            value={css}
            onChange={(e) => handleCssChange(e.target.value)}
            className="code-editor flex-1 resize-none font-mono text-xs"
            placeholder="Enter your CSS code here..."
          />
        </div>
      </Card>
    </div>
  );
}