import { useEffect, useMemo, useState } from 'react';
import {
  Store,
  Bell,
  Shield,
  CreditCard,
  QrCode,
  Banknote,
  Mail,
  Palette,
  Save,
  Upload,
  Check,
  Copy,
  Link2,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { AppSelect } from '@/components/shared/AppSelect';
import {
  getBarbershopProfile,
  updateBarbershopProfile,
} from '../../service/barbershopProfileService';
import {
  getHomeInfo,
  type HomeInfo,
  updateHomeInfo,
} from '../../service/homeInfoService';
import {
  getPaymentFrequencySettings,
  getSettings,
  type BookingPaymentMethod,
  type PaymentFrequency,
  type Settings,
  updatePaymentFrequencySettings,
  updateSettings,
} from '../../service/settingsService';
import { changePassword } from '../../service/userService';

type StoredBarbershop = {
  id?: string;
  name?: string;
  slug?: string;
};

const PAYMENT_FREQUENCY_OPTIONS: Array<{
  value: PaymentFrequency;
  label: string;
}> = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
];

const MAX_HERO_IMAGES = 5;

interface SettingsProps {
  canShareRegistrationLink?: boolean;
}

function getStoredBarbershop() {
  const storedBarbershop = localStorage.getItem('barbershop');

  if (!storedBarbershop) {
    return null;
  }

  try {
    return JSON.parse(storedBarbershop) as StoredBarbershop;
  } catch {
    return null;
  }
}

function getApiErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;

    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data[0];
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      return (data as { message: string }).message;
    }

    if (typeof data === 'string') {
      return data;
    }
  }

  return null;
}

function getHeroImages(data: HomeInfo) {
  const images = Array.isArray(data.hero_images)
    ? data.hero_images
    : [];
  const fallbackImage = data.hero_image ? [data.hero_image] : [];

  return [...images, ...fallbackImage]
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, allImages) => allImages.indexOf(image) === index)
    .slice(0, MAX_HERO_IMAGES);
}

export function SettingsPage({ canShareRegistrationLink = false }: SettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
  });
  const [businessSlug, setBusinessSlug] = useState('');
  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
  const [heroForm, setHeroForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_images: [] as string[],
  });
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [workingHoursForm, setWorkingHoursForm] = useState({
    schedule_title: '',
    schedule_line1: '',
    schedule_line2: '',
    schedule_line3: '',
  });
  const [aboutForm, setAboutForm] = useState({
    about_title: '',
    about_text1: '',
    about_text2: '',
    about_text3: '',
  });
  const [locationForm, setLocationForm] = useState({
    location_title: '',
    location_address: '',
    location_city: '',
  });
  const [isLoadingBusinessProfile, setIsLoadingBusinessProfile] = useState(false);
  const [isLoadingHomeInfo, setIsLoadingHomeInfo] = useState(false);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    Record<BookingPaymentMethod, boolean>
  >({
    cartao: true,
    pix: true,
    local: true,
  });
  const [barberPaymentFrequency, setBarberPaymentFrequency] =
    useState<PaymentFrequency>('monthly');
  const [employeePaymentFrequency, setEmployeePaymentFrequency] =
    useState<PaymentFrequency>('monthly');
  const [hasLoadedPaymentSettings, setHasLoadedPaymentSettings] = useState(false);
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(false);
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);
  const barbershop = useMemo(() => getStoredBarbershop(), []);
  const registrationLink = useMemo(() => {
    const slug = businessSlug || barbershop?.slug;

    if (!slug) {
      return '';
    }

    return `${window.location.origin}/register/${slug}`;
  }, [barbershop?.slug, businessSlug]);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessProfile() {
      setIsLoadingBusinessProfile(true);

      try {
        const profile = await getBarbershopProfile();

        if (!isMounted) {
          return;
        }

        setBusinessForm({
          name: profile.name ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          cnpj: profile.cnpj ?? '',
        });
        setBusinessSlug(profile.slug ?? '');
      } catch {
        if (isMounted) {
          toast.error('Erro ao carregar dados da barbearia.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingBusinessProfile(false);
        }
      }
    }

    loadBusinessProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'general') {
      return;
    }

    let isMounted = true;

    async function loadHomeInfo() {
      setIsLoadingHomeInfo(true);

      try {
        const data = await getHomeInfo();

        if (!isMounted) {
          return;
        }

        setHomeInfo(data);
        setHeroForm({
          hero_title: data.hero_title ?? '',
          hero_subtitle: data.hero_subtitle ?? '',
          hero_images: getHeroImages(data),
        });
        setHeroImageUrl('');
        setWorkingHoursForm({
          schedule_title: data.schedule_title ?? '',
          schedule_line1: data.schedule_line1 ?? '',
          schedule_line2: data.schedule_line2 ?? '',
          schedule_line3: data.schedule_line3 ?? '',
        });
        setAboutForm({
          about_title: data.about_title ?? '',
          about_text1: data.about_text1 ?? '',
          about_text2: data.about_text2 ?? '',
          about_text3: data.about_text3 ?? '',
        });
        setLocationForm({
          location_title: data.location_title ?? '',
          location_address: data.location_address ?? '',
          location_city: data.location_city ?? '',
        });
      } catch (error) {
        if (isMounted) {
          const message = getApiErrorMessage(error);
          toast.error(message || 'Erro ao carregar informacoes da pagina inicial.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingHomeInfo(false);
        }
      }
    }

    loadHomeInfo();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'payments' || hasLoadedPaymentSettings) {
      return;
    }

    let isMounted = true;

    async function loadPaymentSettings() {
      setIsLoadingPaymentSettings(true);

      try {
        const [settingsData, frequencyData] = await Promise.all([
          getSettings(),
          getPaymentFrequencySettings(),
        ]);

        if (!isMounted) {
          return;
        }

        setSettings(settingsData);
        setPaymentMethods({
          cartao: !settingsData.hiddenBookingPaymentMethods.includes('cartao'),
          pix: !settingsData.hiddenBookingPaymentMethods.includes('pix'),
          local: !settingsData.hiddenBookingPaymentMethods.includes('local'),
        });
        setBarberPaymentFrequency(frequencyData.barberPaymentFrequency);
        setEmployeePaymentFrequency(frequencyData.employeePaymentFrequency);
        setHasLoadedPaymentSettings(true);
      } catch {
        if (isMounted) {
          toast.error('Erro ao carregar configuracoes de pagamento.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPaymentSettings(false);
        }
      }
    }

    loadPaymentSettings();

    return () => {
      isMounted = false;
    };
  }, [activeTab, hasLoadedPaymentSettings]);

  function updateBusinessField(field: keyof typeof businessForm, value: string) {
    setBusinessForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateWorkingHoursField(
    field: keyof typeof workingHoursForm,
    value: string
  ) {
    setWorkingHoursForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateHeroField(
    field: keyof Pick<typeof heroForm, 'hero_title' | 'hero_subtitle'>,
    value: string
  ) {
    setHeroForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addHeroImage() {
    const trimmedUrl = heroImageUrl.trim();

    if (!trimmedUrl) {
      toast.error('Informe a URL da imagem do banner.');
      return;
    }

    if (heroForm.hero_images.includes(trimmedUrl)) {
      toast.error('Esta imagem ja foi adicionada ao banner.');
      return;
    }

    if (heroForm.hero_images.length >= MAX_HERO_IMAGES) {
      toast.error('O banner pode ter no maximo 5 imagens.');
      return;
    }

    setHeroForm((current) => ({
      ...current,
      hero_images: [...current.hero_images, trimmedUrl],
    }));
    setHeroImageUrl('');
  }

  function removeHeroImage(imageUrl: string) {
    setHeroForm((current) => ({
      ...current,
      hero_images: current.hero_images.filter((image) => image !== imageUrl),
    }));
  }

  function updateAboutField(field: keyof typeof aboutForm, value: string) {
    setAboutForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateLocationField(field: keyof typeof locationForm, value: string) {
    setLocationForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePaymentMethod(method: BookingPaymentMethod, enabled: boolean) {
    setPaymentMethods((current) => ({
      ...current,
      [method]: enabled,
    }));
  }

  function getHiddenBookingPaymentMethods() {
    return (Object.entries(paymentMethods) as Array<[BookingPaymentMethod, boolean]>)
      .filter(([, enabled]) => !enabled)
      .map(([method]) => method);
  }

  async function saveGeneralSettings() {
    const trimmedHeroImages = heroForm.hero_images
      .map((image) => image.trim())
      .filter(Boolean)
      .filter((image, index, allImages) => allImages.indexOf(image) === index)
      .slice(0, MAX_HERO_IMAGES);
    const trimmedHeroForm = {
      hero_title: heroForm.hero_title.trim(),
      hero_subtitle: heroForm.hero_subtitle.trim(),
      hero_image: trimmedHeroImages[0] ?? '',
      hero_images: trimmedHeroImages,
    };
    const trimmedAboutForm = {
      about_title: aboutForm.about_title.trim(),
      about_text1: aboutForm.about_text1.trim(),
      about_text2: aboutForm.about_text2.trim(),
      about_text3: aboutForm.about_text3.trim(),
    };
    const trimmedLocationForm = {
      location_title: locationForm.location_title.trim(),
      location_address: locationForm.location_address.trim(),
      location_city: locationForm.location_city.trim(),
    };
    const trimmedWorkingHoursForm = {
      schedule_title: workingHoursForm.schedule_title.trim(),
      schedule_line1: workingHoursForm.schedule_line1.trim(),
      schedule_line2: workingHoursForm.schedule_line2.trim(),
      schedule_line3: workingHoursForm.schedule_line3.trim(),
    };

    if (
      !trimmedAboutForm.about_title ||
      !trimmedAboutForm.about_text1 ||
      !trimmedAboutForm.about_text2 ||
      !trimmedAboutForm.about_text3
    ) {
      toast.error('Preencha o titulo e os 3 paragrafos da secao Sobre Nos.');
      return;
    }

    if (
      !trimmedLocationForm.location_title ||
      !trimmedLocationForm.location_address ||
      !trimmedLocationForm.location_city
    ) {
      toast.error('Preencha titulo, endereco e cidade da secao Localizacao.');
      return;
    }

    setIsSavingGeneralSettings(true);

    try {
      const [profile, updatedHomeInfo] = await Promise.all([
        updateBarbershopProfile({
          name: businessForm.name,
          email: businessForm.email,
          phone: businessForm.phone,
          cnpj: businessForm.cnpj,
        }),
        updateHomeInfo({
          ...(homeInfo ?? {}),
          ...trimmedHeroForm,
          ...trimmedAboutForm,
          ...trimmedLocationForm,
          ...trimmedWorkingHoursForm,
        }),
      ]);

      setBusinessForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        cnpj: profile.cnpj ?? '',
      });
      setBusinessSlug(profile.slug ?? '');
      localStorage.setItem(
        'barbershop',
        JSON.stringify({
          ...getStoredBarbershop(),
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
        })
      );
      setHomeInfo(updatedHomeInfo);
      setHeroForm({
        hero_title: updatedHomeInfo.hero_title ?? '',
        hero_subtitle: updatedHomeInfo.hero_subtitle ?? '',
        hero_images: getHeroImages(updatedHomeInfo),
      });
      setHeroImageUrl('');
      setWorkingHoursForm({
        schedule_title: updatedHomeInfo.schedule_title ?? '',
        schedule_line1: updatedHomeInfo.schedule_line1 ?? '',
        schedule_line2: updatedHomeInfo.schedule_line2 ?? '',
        schedule_line3: updatedHomeInfo.schedule_line3 ?? '',
      });
      setAboutForm({
        about_title: updatedHomeInfo.about_title ?? '',
        about_text1: updatedHomeInfo.about_text1 ?? '',
        about_text2: updatedHomeInfo.about_text2 ?? '',
        about_text3: updatedHomeInfo.about_text3 ?? '',
      });
      setLocationForm({
        location_title: updatedHomeInfo.location_title ?? '',
        location_address: updatedHomeInfo.location_address ?? '',
        location_city: updatedHomeInfo.location_city ?? '',
      });
      toast.success('Configuracoes gerais salvas com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar configuracoes gerais.');
    } finally {
      setIsSavingGeneralSettings(false);
    }
  }

  async function copyRegistrationLink() {
    if (!registrationLink) {
      toast.error('Slug da barbearia nao encontrado.');
      return;
    }

    await navigator.clipboard.writeText(registrationLink);
    toast.success('Link de cadastro copiado.');
  }

  async function handleChangePassword() {
    if (isChangingPassword) {
      return;
    }

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
      toast.error('Preencha todos os campos de senha.');
      return;
    }

    if (trimmedNewPassword.length < 4) {
      toast.error('A nova senha deve ter no minimo 4 caracteres.');
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      toast.error('A confirmacao da senha nao coincide com a nova senha.');
      return;
    }

    if (!user?.id) {
      toast.error('Usuario autenticado nao encontrado. Faca login novamente.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(user.id, {
        currentPassword: trimmedCurrentPassword,
        newPassword: trimmedNewPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao atualizar senha.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function savePaymentSettings() {
    if (isSavingPaymentSettings || isLoadingPaymentSettings) {
      return;
    }

    setIsSavingPaymentSettings(true);

    try {
      const [updatedSettings, updatedFrequencySettings] = await Promise.all([
        updateSettings({
          pixKey: settings?.pixKey ?? '',
          termsDocumentUrl: settings?.termsDocumentUrl ?? '',
          termsDocumentName: settings?.termsDocumentName ?? '',
          hiddenBookingPaymentMethods: getHiddenBookingPaymentMethods(),
        }),
        updatePaymentFrequencySettings({
          barberPaymentFrequency,
          employeePaymentFrequency,
        }),
      ]);

      setSettings(updatedSettings);
      setPaymentMethods({
        cartao: !updatedSettings.hiddenBookingPaymentMethods.includes('cartao'),
        pix: !updatedSettings.hiddenBookingPaymentMethods.includes('pix'),
        local: !updatedSettings.hiddenBookingPaymentMethods.includes('local'),
      });
      setBarberPaymentFrequency(updatedFrequencySettings.barberPaymentFrequency);
      setEmployeePaymentFrequency(updatedFrequencySettings.employeePaymentFrequency);
      setHasLoadedPaymentSettings(true);
      toast.success('Configuracoes de pagamento salvas com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar configuracoes de pagamento.');
    } finally {
      setIsSavingPaymentSettings(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Store size={14} />
            <span className="hidden sm:inline">Configurações Gerais</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell size={14} />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield size={14} />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard size={14} />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail size={14} />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette size={14} />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          {canShareRegistrationLink && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Link2 size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    Link de cadastro da barbearia
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Envie este link para clientes se cadastrarem diretamente nesta barbearia.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={registrationLink || 'Slug da barbearia nao encontrado'}
                  readOnly
                  className="h-10 flex-1 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />

                <Button
                  type="button"
                  onClick={copyRegistrationLink}
                  disabled={!registrationLink}
                  className="gap-2"
                >
                  <Copy size={14} />
                  Copiar link
                </Button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Informações comerciais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome comercial</label>
                <input 
                  type="text" 
                  value={businessForm.name}
                  onChange={(event) => updateBusinessField('name', event.target.value)}
                  disabled={isLoadingBusinessProfile}
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input 
                  type="email" 
                  value={businessForm.email}
                  onChange={(event) => updateBusinessField('email', event.target.value)}
                  disabled={isLoadingBusinessProfile}
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contato</label>
                <input 
                  type="tel" 
                  value={businessForm.phone}
                  onChange={(event) => updateBusinessField('phone', event.target.value)}
                  disabled={isLoadingBusinessProfile}
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">CNPJ</label>
                <input 
                  type="text" 
                  value={businessForm.cnpj}
                  onChange={(event) => updateBusinessField('cnpj', event.target.value)}
                  disabled={isLoadingBusinessProfile}
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Business Logo</h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-secondary rounded-xl flex items-center justify-center border border-border">
                <span className="text-3xl font-bold text-primary">B</span>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="gap-2" disabled>
                  <Upload size={14} />
                  Upload New Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Logo ainda nao disponivel no cadastro atual.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-foreground">Banner de Inicio</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o texto e ate 5 imagens por URL para o banner inicial.
                </p>
              </div>
              <Badge variant="outline">
                {heroForm.hero_images.length}/{MAX_HERO_IMAGES}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Titulo do banner</label>
                  <input
                    type="text"
                    value={heroForm.hero_title}
                    onChange={(event) =>
                      updateHeroField('hero_title', event.target.value)
                    }
                    disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                    placeholder="BarberOne"
                    className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subtitulo do banner</label>
                  <input
                    type="text"
                    value={heroForm.hero_subtitle}
                    onChange={(event) =>
                      updateHeroField('hero_subtitle', event.target.value)
                    }
                    disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                    placeholder="Agende seu horario com praticidade"
                    className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">URL da imagem</label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="url"
                    value={heroImageUrl}
                    onChange={(event) => setHeroImageUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addHeroImage();
                      }
                    }}
                    disabled={
                      isLoadingHomeInfo ||
                      isSavingGeneralSettings ||
                      heroForm.hero_images.length >= MAX_HERO_IMAGES
                    }
                    placeholder="https://exemplo.com/banner.jpg"
                    className="h-10 flex-1 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={addHeroImage}
                    disabled={
                      isLoadingHomeInfo ||
                      isSavingGeneralSettings ||
                      heroForm.hero_images.length >= MAX_HERO_IMAGES
                    }
                  >
                    <Plus size={14} />
                    Adicionar
                  </Button>
                </div>
              </div>

              {heroForm.hero_images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heroForm.hero_images.map((imageUrl, index) => (
                    <div
                      key={imageUrl}
                      className="overflow-hidden rounded-lg border border-border bg-secondary"
                    >
                      <div className="relative aspect-video bg-background">
                        <img
                          src={imageUrl}
                          alt={`Imagem ${index + 1} do banner`}
                          className="h-full w-full object-cover"
                        />
                        {index === 0 && (
                          <Badge className="absolute left-2 top-2">
                            Principal
                          </Badge>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => removeHeroImage(imageUrl)}
                          disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                          className="absolute right-2 top-2 h-8 w-8"
                          aria-label="Remover imagem do banner"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      <p className="truncate px-3 py-2 text-xs text-muted-foreground">
                        {imageUrl}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma imagem adicionada ao banner.
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Sobre Nos</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Titulo da Secao</label>
                <input
                  type="text"
                  value={aboutForm.about_title}
                  onChange={(event) =>
                    updateAboutField('about_title', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Sobre Nos"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Paragrafo 1</label>
                <textarea
                  value={aboutForm.about_text1}
                  onChange={(event) =>
                    updateAboutField('about_text1', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  rows={3}
                  className="w-full resize-y bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Paragrafo 2</label>
                <textarea
                  value={aboutForm.about_text2}
                  onChange={(event) =>
                    updateAboutField('about_text2', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  rows={3}
                  className="w-full resize-y bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Paragrafo 3</label>
                <textarea
                  value={aboutForm.about_text3}
                  onChange={(event) =>
                    updateAboutField('about_text3', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  rows={3}
                  className="w-full resize-y bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Localizacao</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Titulo</label>
                <input
                  type="text"
                  value={locationForm.location_title}
                  onChange={(event) =>
                    updateLocationField('location_title', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Onde estamos"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Endereco</label>
                <input
                  type="text"
                  value={locationForm.location_address}
                  onChange={(event) =>
                    updateLocationField('location_address', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Rua, numero e bairro"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cidade</label>
                <input
                  type="text"
                  value={locationForm.location_city}
                  onChange={(event) =>
                    updateLocationField('location_city', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Cidade - UF"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Horario de Funcionamento</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Titulo</label>
                <input
                  type="text"
                  value={workingHoursForm.schedule_title}
                  onChange={(event) =>
                    updateWorkingHoursField('schedule_title', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Linha 1</label>
                <input
                  type="text"
                  value={workingHoursForm.schedule_line1}
                  onChange={(event) =>
                    updateWorkingHoursField('schedule_line1', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Segunda a Sexta - 09:00 as 18:00"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Linha 2</label>
                <input
                  type="text"
                  value={workingHoursForm.schedule_line2}
                  onChange={(event) =>
                    updateWorkingHoursField('schedule_line2', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Sabado - 09:00 as 18:00"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Linha 3</label>
                <input
                  type="text"
                  value={workingHoursForm.schedule_line3}
                  onChange={(event) =>
                    updateWorkingHoursField('schedule_line3', event.target.value)
                  }
                  disabled={isLoadingHomeInfo || isSavingGeneralSettings}
                  placeholder="Domingo - Fechado"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="gap-2"
              onClick={saveGeneralSettings}
              disabled={
                isLoadingBusinessProfile ||
                isLoadingHomeInfo ||
                isSavingGeneralSettings
              }
            >
              {isSavingGeneralSettings ? <Spinner /> : <Save size={14} />}
              {isSavingGeneralSettings ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { label: 'New Booking', description: 'Receive an email when a new booking is made', checked: true },
                { label: 'Booking Cancelled', description: 'Receive an email when a booking is cancelled', checked: true },
                { label: 'New Customer', description: 'Receive an email when a new customer registers', checked: false },
                { label: 'Payment Received', description: 'Receive an email when a payment is processed', checked: true },
                { label: 'Low Stock Alert', description: 'Receive an email when product stock is low', checked: true },
                { label: 'Daily Summary', description: 'Receive a daily summary of all activities', checked: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Push Notifications</h3>
            <div className="space-y-4">
              {[
                { label: 'Enable Push Notifications', description: 'Receive notifications in your browser', checked: true },
                { label: 'Sound Alerts', description: 'Play sound when notification arrives', checked: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save size={14} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Alterar Senha</h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha Atual</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Digite sua senha atual"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nova Senha</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Digite sua nova senha"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isChangingPassword}
                  placeholder="Confirme sua nova senha"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="gap-2"
              >
                {isChangingPassword && <Spinner />}
                {isChangingPassword ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Enable 2FA</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Session Management</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Current Session</p>
                  <p className="text-xs text-muted-foreground">Chrome on Windows • IP: 192.168.1.1</p>
                </div>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">
                  <Check size={12} className="mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Métodos de Pagamento</h3>
            <div className="space-y-4">
              {[
                {
                  id: 'cartao' as const,
                  name: 'Cartao',
                  description: 'Credito e debito usam a mesma forma de pagamento no agendamento.',
                  icon: CreditCard,
                },
                {
                  id: 'pix' as const,
                  name: 'PIX',
                  description: 'Permitir pagamento via PIX no agendamento.',
                  icon: QrCode,
                },
                {
                  id: 'local' as const,
                  name: 'Dinheiro/Pagamento Local',
                  description: 'Permitir pagamento presencial na barbearia.',
                  icon: Banknote,
                },
              ].map((method) => {
                const Icon = method.icon;

                return (
                  <div key={method.id} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={paymentMethods[method.id]}
                    onCheckedChange={(checked) => updatePaymentMethod(method.id, checked)}
                    disabled={isLoadingPaymentSettings || isSavingPaymentSettings}
                  />
                </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Frequencia de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AppSelect
                label="Frequencia de pagamento - Barbeiros"
                value={barberPaymentFrequency}
                onChange={(value) =>
                  setBarberPaymentFrequency(value as PaymentFrequency)
                }
                options={PAYMENT_FREQUENCY_OPTIONS}
                disabled={isLoadingPaymentSettings || isSavingPaymentSettings}
              />
              <AppSelect
                label="Frequencia de pagamento - Outros funcionarios"
                value={employeePaymentFrequency}
                onChange={(value) =>
                  setEmployeePaymentFrequency(value as PaymentFrequency)
                }
                options={PAYMENT_FREQUENCY_OPTIONS}
                disabled={isLoadingPaymentSettings || isSavingPaymentSettings}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="gap-2"
              onClick={savePaymentSettings}
              disabled={isLoadingPaymentSettings || isSavingPaymentSettings}
            >
              {isSavingPaymentSettings ? <Spinner /> : <Save size={14} />}
              {isSavingPaymentSettings ? 'Saving...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">SMTP Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">SMTP Host</label>
                <input 
                  type="text" 
                  defaultValue="smtp.gmail.com"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">SMTP Port</label>
                <input 
                  type="number" 
                  defaultValue="587"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">SMTP Username</label>
                <input 
                  type="text" 
                  defaultValue="noreply@barberone.com"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">SMTP Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  className="w-full bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Email Templates</h3>
            <div className="space-y-3">
              {[
                { name: 'Booking Confirmation', subject: 'Your booking is confirmed!' },
                { name: 'Booking Reminder', subject: 'Reminder: Your appointment tomorrow' },
                { name: 'Payment Receipt', subject: 'Payment received - Thank you!' },
                { name: 'Welcome Email', subject: 'Welcome to BarberOne!' },
              ].map((template, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.subject}</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save size={14} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Theme Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Enable dark mode for the dashboard</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing between elements</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    defaultValue="#f97316"
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#f97316"
                    className="flex-1 bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    defaultValue="#1a1a1a"
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#1a1a1a"
                    className="flex-1 bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    defaultValue="#10b981"
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                  />
                  <input 
                    type="text" 
                    defaultValue="#10b981"
                    className="flex-1 bg-secondary text-sm text-foreground rounded-md px-3 py-2 border border-border"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save size={14} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
