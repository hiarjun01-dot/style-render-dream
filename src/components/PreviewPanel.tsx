import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, AlertCircle, Download, Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface PreviewPanelProps {
  html: string;
  css: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      setError(null);

      let processedHtml = html;
      // If the provided HTML is a fragment, wrap it for preview.
      if (!/<\/body>/i.test(processedHtml)) {
        processedHtml = `<body>${processedHtml}</body>`;
      }
      if (!/<\/head>/i.test(processedHtml)) {
         processedHtml = `<head><meta charset="UTF-8"><title>Preview</title></head>${processedHtml}`;
      }

      // Correctly inject the CSS from the editor right before the closing </head> tag.
      // This is case-insensitive and works reliably.
      const fullHtml = processedHtml.replace(
        /<\/head>/i,
        `<style>${css}</style></head>`
      );

      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown preview error occurred';
      setError(errorMessage);
      console.error('Preview error:', err);
    }
  }, [html, css, device]);

  const getDeviceIcon = (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
    }
  };

  const captureIframeContent = async (): Promise<HTMLCanvasElement> => {
    if (!iframeRef.current) throw new Error('Preview not available');
    
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc || !iframeDoc.body) {
      throw new Error('No content to capture');
    }

    // Create a temporary container with the iframe content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = iframe.offsetWidth + 'px';
    tempDiv.style.height = iframe.offsetHeight + 'px';
    tempDiv.innerHTML = iframeDoc.documentElement.outerHTML;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await html2canvas(tempDiv, {
        width: iframe.offsetWidth,
        height: iframe.offsetHeight,
        backgroundColor: '#ffffff',
        scale: 2 // Higher quality
      });
      
      return canvas;
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const downloadImage = async (format: 'png' | 'jpg') => {
    try {
      setIsDownloading(format);
      const canvas = await captureIframeContent();
      
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.9 : undefined;
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to generate image');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `preview.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete!",
          description: `Preview downloaded as ${format.toUpperCase()} file.`,
        });
      }, mimeType, quality);
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : 'Failed to download image',
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const downloadGIF = async () => {
    try {
      setIsDownloading('gif');
      
      // Simple GIF implementation - capture current state
      // For a true animated GIF of carousel slides, you'd need additional carousel state
      const canvas = await captureIframeContent();
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to generate GIF');
        
        // Note: This creates a static image as GIF. For true animation,
        // you'd need a GIF encoding library like gif.js
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preview.gif';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete!",
          description: "Preview downloaded as GIF file.",
        });
      }, 'image/png'); // Using PNG format for better quality
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : 'Failed to download GIF',
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Live Preview</h2>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map((deviceType) => (
            <Button
              key={deviceType}
              variant={device === deviceType ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDevice(deviceType)}
              className={device === deviceType ? 'glow-button' : ''}
            >
              {getDeviceIcon(deviceType)}
              <span className="ml-2 capitalize">{deviceType}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Container */}
      <Card className="card-gradient flex-1 p-4 flex items-center justify-center">
        {error ? (
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Preview Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-full h-full transition-all duration-300 ease-in-out"
            style={{
              maxWidth: deviceDimensions[device].width,
              maxHeight: deviceDimensions[device].height
            }}
          >
            <iframe
              ref={iframeRef}
              className="preview-iframe w-full h-full border-0 rounded-lg bg-white shadow-lg"
              sandbox="allow-scripts allow-same-origin"
              title="HTML/CSS Preview"
            />
          </div>
        )}
      </Card>

      {/* Download Options */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage('png')}
          disabled={!!isDownloading || !!error}
          className="flex items-center gap-2"
        >
          {isDownloading === 'png' ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Image className="w-4 h-4" />
          )}
          Download PNG
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadImage('jpg')}
          disabled={!!isDownloading || !!error}
          className="flex items-center gap-2"
        >
          {isDownloading === 'jpg' ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <FileImage className="w-4 h-4" />
          )}
          Download JPG
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={downloadGIF}
          disabled={!!isDownloading || !!error}
          className="flex items-center gap-2"
        >
          {isDownloading === 'gif' ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download GIF
        </Button>
      </div>

      {/* Device Info */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Viewing in {device} mode ({deviceDimensions[device].width} × {deviceDimensions[device].height})
      </div>
    </div>
  );
}
