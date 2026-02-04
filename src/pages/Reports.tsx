import { useState } from 'react';
import { BarChart3, TrendingDown, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type ReportType = 'variance' | 'usage' | 'cost' | 'waste';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('variance');
  const [dateRange, setDateRange] = useState('7d');
  const { t } = useLanguage();

  const reports: { id: ReportType; labelKey: string; icon: React.ElementType; descKey: string }[] = [
    { id: 'variance', labelKey: 'reports.variance', icon: AlertTriangle, descKey: 'reports.varianceDesc' },
    { id: 'usage', labelKey: 'reports.usage', icon: TrendingDown, descKey: 'reports.usageDesc' },
    { id: 'cost', labelKey: 'reports.cost', icon: DollarSign, descKey: 'reports.costDesc' },
    { id: 'waste', labelKey: 'reports.waste', icon: AlertTriangle, descKey: 'reports.wasteDesc' },
  ];

  const dateRanges = [
    { value: '7d', label: `7 ${t('reports.days')}` },
    { value: '30d', label: `30 ${t('reports.days')}` },
    { value: '90d', label: `90 ${t('reports.days')}` },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-secondary rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  dateRange === range.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "glass-card rounded-2xl p-4 text-left transition-all touch-target",
                activeReport === report.id
                  ? "ring-2 ring-primary"
                  : "hover:bg-card/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                activeReport === report.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{t(report.labelKey)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t(report.descKey)}</p>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="glass-card rounded-2xl p-6">
        {activeReport === 'variance' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="font-display font-semibold text-lg">{t('reports.varianceReport')}</h2>
            </div>
            
            <div className="space-y-4">
              {/* Sample variance items */}
              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Grey Goose Vodka</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-warning">-2.5 {t('reports.bottles')}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.vsPOS')}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('reports.aiInsight')} 0.3 {t('reports.bottles')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Hendrick's Gin</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">-0.3 {t('reports.bottles')}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.vsPOS')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Don Julio Blanco</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">+0.1 {t('reports.bottles')}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.vsPOS')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'usage' && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('reports.usageChart')}</p>
            <p className="text-sm">{t('reports.connectCloud')}</p>
          </div>
        )}

        {activeReport === 'cost' && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('reports.costAnalysis')}</p>
            <p className="text-sm">{t('reports.connectCloud')}</p>
          </div>
        )}

        {activeReport === 'waste' && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('reports.wasteLog')}</p>
            <p className="text-sm">{t('reports.noWaste')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
