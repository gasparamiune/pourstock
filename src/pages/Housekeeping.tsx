import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { HKStatusBoard } from '@/components/housekeeping/HKStatusBoard';
import { MyTasksList } from '@/components/housekeeping/MyTasksList';

export default function Housekeeping() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('board');

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('housekeeping.title')}</h1>
        <p className="text-muted-foreground">{t('housekeeping.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="board">{t('housekeeping.statusBoard')}</TabsTrigger>
          <TabsTrigger value="mytasks">{t('housekeeping.myTasks')}</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <HKStatusBoard />
        </TabsContent>

        <TabsContent value="mytasks" className="mt-4">
          <MyTasksList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
