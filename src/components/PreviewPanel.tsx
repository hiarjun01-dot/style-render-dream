import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PreviewPanelProps {
  html: string;
  css: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ html, css }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [error, setError] = useState<string | null>(null);

  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };

  useEffect(() => {
    if (!iframeRef.current) return;

    try {
      setError(null);
      
      // Create complete HTML document with embedded CSS
      const fullHtml = html.includes('<style>') || html.includes('<link') 
        ? html 
        : html.replace(
            '<head>',
            `<head>
              <style>${css}</style>`
          );

      // Validate basic HTML structure
      if (!fullHtml.includes('<html') && !fullHtml.includes('<body')) {
        throw new Error('Invalid HTML structure. Please include proper HTML tags.');
      }

      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview error occurred');
      console.error('Preview error:', err);
    }
  }, [html, css]);

  const getDeviceIcon = (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
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
      <Card className="card-gradient flex-1 p-4">
        <div className="w-full h-full flex items-center justify-center">
          {error ? (
            <div className="text-center p-8">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Preview Error</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center w-full h-full"
              style={{ 
                maxWidth: deviceDimensions[device].width,
                maxHeight: deviceDimensions[device].height 
              }}
            >
              <iframe
                ref={iframeRef}
                className="preview-iframe w-full h-full border-0 rounded-lg"
                style={{
                  width: device === 'desktop' ? '100%' : deviceDimensions[device].width,
                  height: device === 'desktop' ? '100%' : deviceDimensions[device].height,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                sandbox="allow-scripts allow-same-origin"
                title="HTML/CSS Preview"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Device Info */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Viewing in {device} mode ({deviceDimensions[device].width} × {deviceDimensions[device].height})
      </div>
    </div>
  );
}