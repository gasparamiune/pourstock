import { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PdfUploaderProps {
  onUpload: (base64: string) => void;
  isProcessing: boolean;
}

export function PdfUploader({ onUpload, isProcessing }: PdfUploaderProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onUpload(base64);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onClickUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg font-medium text-foreground">{t('tablePlan.processing')}</p>
        <p className="text-sm text-muted-foreground">{t('tablePlan.extracting')}</p>
      </div>
    );
  }

  return (
    <div
      onClick={onClickUpload}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-16 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
        isDragging ? "bg-primary/20" : "bg-muted"
      )}>
        {isDragging ? (
          <FileText className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">{t('tablePlan.uploadPdf')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('tablePlan.dragDrop')}</p>
      </div>
    </div>
  );
}
