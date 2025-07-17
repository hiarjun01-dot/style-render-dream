import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  initialHtml: string;
  initialCss: string;
  onCodeChange: (html: string, css: string) => void;
  onDownload: () => void;
}

export function CodeEditor({ initialHtml, initialCss, onCodeChange, onDownload }: CodeEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
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
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
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

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Code Editor</h2>
        <div className="flex gap-2">
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
            className="glow-button text-primary-foreground"
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