import { useSearchParams } from 'react-router-dom';
import { FileStack, Settings, Star } from 'lucide-react';
import { TabPanel, Tabs } from '@/components/Tabs';
import { useCurrentUser } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { FavoritesTab } from '@/features/account/FavoritesTab';
import { MyPostsTab } from '@/features/account/MyPostsTab';
import { ProfileHeader } from '@/features/account/ProfileHeader';
import { SettingsTab } from '@/features/account/SettingsTab';

type AccountTab = 'publicaciones' | 'favoritos' | 'configuracion';
const TABS: AccountTab[] = ['publicaciones', 'favoritos', 'configuracion'];
const TABS_ID = 'account';

export function AccountPage() {
  const user = useCurrentUser();
  const { favorites } = useFavorites();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as AccountTab | null;
  const tab: AccountTab = requested && TABS.includes(requested) ? requested : 'publicaciones';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <ProfileHeader user={user} />

      <div>
        <Tabs<AccountTab>
          idBase={TABS_ID}
          label="Secciones de mi cuenta"
          value={tab}
          onChange={(next) => setParams(next === 'publicaciones' ? {} : { tab: next }, { replace: true })}
          fill
          compact
          className="sm:[&>button]:flex-none"
          items={[
            { id: 'publicaciones', label: 'Mis publicaciones', icon: <FileStack className="h-4 w-4" aria-hidden /> },
            { id: 'favoritos', label: 'Favoritos', icon: <Star className="h-4 w-4" aria-hidden />, badge: favorites.length },
            { id: 'configuracion', label: 'Configuración', icon: <Settings className="h-4 w-4" aria-hidden /> },
          ]}
        />

        <TabPanel idBase={TABS_ID} id={tab} className="pt-4">
          {tab === 'publicaciones' && <MyPostsTab userId={user.id} />}
          {tab === 'favoritos' && <FavoritesTab />}
          {tab === 'configuracion' && <SettingsTab />}
        </TabPanel>
      </div>
    </div>
  );
}
