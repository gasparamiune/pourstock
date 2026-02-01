import { 
  ArrowDownToLine, 
  ArrowRightLeft, 
  AlertTriangle, 
  Trash2, 
  BarChart3,
  ClipboardCheck 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type Location = Tables<'locations'>;
type StockMovement = Tables<'stock_movements'>;

type MovementType = 'adjustment' | 'receiving' | 'transfer' | 'wastage' | 'breakage' | 'pos_sale' | 'count';

interface RecentActivityProps {
  movements: StockMovement[];
  products: Product[];
  locations: Location[];
}

const movementConfig: Record<MovementType, { icon: React.ElementType; label: string; colorClass: string }> = {
  adjustment: { icon: BarChart3, label: 'Adjusted', colorClass: 'text-info bg-info/10' },
  receiving: { icon: ArrowDownToLine, label: 'Received', colorClass: 'text-success bg-success/10' },
  transfer: { icon: ArrowRightLeft, label: 'Transferred', colorClass: 'text-primary bg-primary/10' },
  wastage: { icon: AlertTriangle, label: 'Wastage', colorClass: 'text-warning bg-warning/10' },
  breakage: { icon: Trash2, label: 'Breakage', colorClass: 'text-destructive bg-destructive/10' },
  pos_sale: { icon: BarChart3, label: 'POS Sale', colorClass: 'text-info bg-info/10' },
  count: { icon: ClipboardCheck, label: 'Counted', colorClass: 'text-muted-foreground bg-secondary' },
};

export function RecentActivity({ movements, products, locations }: RecentActivityProps) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {movements.map((movement) => {
          const product = products.find(p => p.id === movement.product_id);
          const location = locations.find(l => l.id === movement.location_id);
          const config = movementConfig[movement.movement_type as MovementType];
          const Icon = config?.icon || BarChart3;

          return (
            <div key={movement.id} className="flex items-start gap-3 py-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                config?.colorClass || 'text-muted-foreground bg-secondary'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {config?.label || movement.movement_type} <span className="text-foreground">{product?.name || 'Unknown product'}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
                  <span>•</span>
                  <span>{location?.name || 'Unknown location'}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(movement.created_at), { addSuffix: true })}</span>
                </div>
                {movement.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-1">{movement.notes}</p>
                )}
              </div>
            </div>
          );
        })}

        {movements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
