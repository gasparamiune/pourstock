import { useNavigate } from 'react-router-dom';
import { Play, Plus, Scan, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { LowStockCard } from '@/components/dashboard/LowStockCard';
import { POSStatusCard } from '@/components/dashboard/POSStatusCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CategoryOverview } from '@/components/dashboard/CategoryOverview';
import { SearchAssistant } from '@/components/search/SearchAssistant';
import { useDashboardData } from '@/hooks/useInventoryData';
import { useLanguage } from '@/contexts/LanguageContext';
import { BeverageCategory, POSSyncStatus } from '@/types/inventory';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { 
    products, 
    locations,
    stockLevels,
    movements, 
    lowStockAlerts, 
    stockByCategory, 
    isLoading 
  } = useDashboardData();

  const handleCategoryClick = (category: BeverageCategory) => {
    navigate(`/inventory?category=${category}`);
  };

  // Mock POS status for now
  const mockPOSSyncStatus: POSSyncStatus = {
    isConnected: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 5),
    pendingItems: 0,
    errors: [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      {/* Search Assistant */}
      <div className="mb-6">
        <SearchAssistant />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Button 
          variant="default" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/inventory?mode=count')}
        >
          <Play className="h-5 w-5" />
          <span className="text-xs">{t('dashboard.quickCount')}</span>
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/products?action=new')}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">{t('dashboard.addItem')}</span>
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/orders?action=receive')}
        >
          <Scan className="h-5 w-5" />
          <span className="text-xs">{t('dashboard.receive')}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <QuickStats 
          totalProducts={products.length}
          lowStockCount={lowStockAlerts.length}
          lastCountedDays={2}
          todayUsageValue={0}
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <LowStockCard 
            alerts={lowStockAlerts} 
            onViewAll={() => navigate('/inventory?filter=low')}
          />
          <CategoryOverview 
            data={stockByCategory}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <POSStatusCard 
            status={mockPOSSyncStatus}
            onSync={() => console.log('Syncing...')}
          />
          <RecentActivity 
            movements={movements} 
            products={products}
            locations={locations}
          />
        </div>
      </div>
    </div>
  );
}
