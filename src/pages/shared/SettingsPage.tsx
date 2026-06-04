import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Store,
  Bell,
  Building2,
  ChevronDown,
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
  CircleUserRound,
  FileText,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { PlatformSubscriptionTab } from '@/components/PlatformSubscriptionTab';
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
  createPagarmeRecipient,
  getPagarmeRecipient,
  updatePagarmeRecipient,
} from '../../service/pagarmeService';
import {
  getHomeInfo,
  type HomeInfo,
  updateHomeInfo,
} from '../../service/homeInfoService';
import {
  uploadBusinessLogo,
  uploadHeroImage,
  uploadPdf,
  uploadProfilePhoto,
} from '../../service/uploadService';
import {
  getPaymentFrequencySettings,
  getSettings,
  type BookingPaymentMethod,
  type PaymentFrequency,
  type Settings,
  updatePaymentFrequencySettings,
  updateSettings,
} from '../../service/settingsService';
import { changePassword, updateProfilePhoto } from '../../service/userService';

type StoredBarbershop = {
  id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
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

function formatCNPJ(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function SettingsPage({ canShareRegistrationLink = false }: SettingsProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoUrl ?? '');
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const profilePhotoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
  });
  const [businessSlug, setBusinessSlug] = useState('');
  const [businessLogoUrl, setBusinessLogoUrl] = useState('');
  const [isUploadingBusinessLogo, setIsUploadingBusinessLogo] = useState(false);
  const businessLogoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
  const [heroForm, setHeroForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_images: [] as string[],
  });
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const heroImageFileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [isSavingBarbershopData, setIsSavingBarbershopData] = useState(false);

  // Recebedor Pagar.me
  const [pagarmeRecipientId, setPagarmeRecipientId] = useState<string | null>(null);
  const [pagarmeRecipientStatus, setPagarmeRecipientStatus] = useState<string | null>(null);
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(false);
  const [recipientExpanded, setRecipientExpanded] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: '', email: '', type: 'individual' as 'individual' | 'company',
    document: '', phone: '', birthdate: '', monthlyIncome: '',
    professionalOccupation: '',
    street: '', streetNumber: '', complementary: '', neighborhood: '',
    city: '', state: 'MG', zipCode: '', referencePoint: '',
    bankHolderName: '', bankHolderType: 'individual' as 'individual' | 'company',
    bankHolderDocument: '', bank: '341', branchNumber: '', branchCheckDigit: '',
    accountNumber: '', accountCheckDigit: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingSecuritySettings, setIsLoadingSecuritySettings] = useState(false);
  const [isSavingSecuritySettings, setIsSavingSecuritySettings] = useState(false);
  const [isUploadingTermsDocument, setIsUploadingTermsDocument] = useState(false);
  const termsDocumentFileInputRef = useRef<HTMLInputElement | null>(null);
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
  const canManageSecurityDocuments = user?.role === 'admin' || user?.isAdmin === true;
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
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
          phone: profile.phone ? formatPhone(profile.phone) : '',
          cnpj: profile.cnpj ? formatCNPJ(profile.cnpj) : '',
        });
        setBusinessSlug(profile.slug ?? '');
        setBusinessLogoUrl(profile.logoUrl ?? '');
        setPagarmeRecipientId(profile.pagarmeRecipientId ?? null);
        setPagarmeRecipientStatus(profile.pagarmeRecipientStatus ?? null);

        // Pré-popula o formulário de recebedor com os dados disponíveis
        if (profile.pagarmeRecipientId) {
          setIsLoadingRecipient(true);
          getPagarmeRecipient(profile.pagarmeRecipientId)
            .then((recipient) => {
              if (!isMounted) return;
              const ri = recipient?.register_information ?? {};
              const addr = ri?.address ?? {};
              const ba = recipient?.default_bank_account ?? {};
              const phone = Array.isArray(ri?.phone_numbers) ? ri.phone_numbers[0] : null;
              setRecipientForm({
                name: ri.name ?? profile.name ?? '',
                email: ri.email ?? profile.email ?? '',
                type: ri.type ?? 'individual',
                document: ri.document ?? '',
                phone: `${phone?.ddd ?? ''}${phone?.number ?? ''}`,
                birthdate: ri.birthdate ? ri.birthdate.split('/').reverse().join('-') : '',
                monthlyIncome: ri.monthly_income ? String(ri.monthly_income) : '',
                professionalOccupation: ri.professional_occupation ?? '',
                street: addr.street ?? '',
                streetNumber: addr.street_number ?? '',
                complementary: addr.complementary ?? '',
                neighborhood: addr.neighborhood ?? '',
                city: addr.city ?? '',
                state: addr.state ?? 'MG',
                zipCode: addr.zip_code ?? '',
                referencePoint: addr.reference_point ?? '',
                bankHolderName: ba.holder_name ?? '',
                bankHolderType: ba.holder_type ?? 'individual',
                bankHolderDocument: ba.holder_document ?? '',
                bank: ba.bank ?? '341',
                branchNumber: ba.branch_number ?? '',
                branchCheckDigit: ba.branch_check_digit ?? '',
                accountNumber: ba.account_number ?? '',
                accountCheckDigit: ba.account_check_digit ?? '',
              });
              setPagarmeRecipientStatus(recipient?.status ?? null);
            })
            .catch(() => {})
            .finally(() => { if (isMounted) setIsLoadingRecipient(false); });
        } else {
          // Pré-popula com dados da barbearia para facilitar o cadastro
          setRecipientForm((prev) => ({
            ...prev,
            name: profile.name ?? '',
            email: profile.email ?? '',
            document: profile.cnpj ?? '',
            bankHolderDocument: profile.cnpj ?? '',
          }));
        }
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
    if (activeTab !== 'general' && activeTab !== 'appearance') {
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

  useEffect(() => {
    if (activeTab !== 'security' || settings) {
      return;
    }

    let isMounted = true;

    async function loadSecuritySettings() {
      setIsLoadingSecuritySettings(true);

      try {
        const settingsData = await getSettings();

        if (!isMounted) {
          return;
        }

        setSettings(settingsData);
      } catch {
        if (isMounted) {
          toast.error('Erro ao carregar documento de termos.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSecuritySettings(false);
        }
      }
    }

    loadSecuritySettings();

    return () => {
      isMounted = false;
    };
  }, [activeTab, settings]);

  useEffect(() => {
    setProfilePhotoUrl(user?.photoUrl ?? '');
  }, [user?.photoUrl]);

  function updateBusinessField(field: keyof typeof businessForm, value: string) {
    setBusinessForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveBarbershopData() {
    if (!businessForm.name.trim()) {
      toast.error('O nome comercial é obrigatório.');
      return;
    }

    setIsSavingBarbershopData(true);
    try {
      const profile = await updateBarbershopProfile({
        name: businessForm.name.trim(),
        email: businessForm.email.trim(),
        phone: businessForm.phone.trim(),
        cnpj: businessForm.cnpj.replace(/\D/g, ''),
        logoUrl: businessLogoUrl,
      });

      setBusinessForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        cnpj: profile.cnpj ? formatCNPJ(profile.cnpj) : '',
      });
      setBusinessSlug(profile.slug ?? '');
      persistStoredBarbershop(profile);

      const isNew = !businessForm.cnpj.replace(/\D/g, '');
      toast.success(isNew ? 'Dados cadastrados com sucesso.' : 'Dados atualizados com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar dados da barbearia.');
    } finally {
      setIsSavingBarbershopData(false);
    }
  }

  function persistStoredBarbershop(profile: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  }) {
    localStorage.setItem(
      'barbershop',
      JSON.stringify({
        ...getStoredBarbershop(),
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        logoUrl: profile.logoUrl ?? '',
      })
    );
    window.dispatchEvent(new Event('barbershop:updated'));
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

  async function uploadHeroImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem.');
      return;
    }

    if (heroForm.hero_images.length >= MAX_HERO_IMAGES) {
      toast.error('O banner pode ter no maximo 5 imagens.');
      return;
    }

    setIsUploadingHeroImage(true);

    try {
      const secureUrl = await uploadHeroImage(file);

      setHeroForm((current) => {
        if (current.hero_images.includes(secureUrl)) {
          return current;
        }

        return {
          ...current,
          hero_images: [...current.hero_images, secureUrl].slice(0, MAX_HERO_IMAGES),
        };
      });

      toast.success('Foto enviada e adicionada ao banner.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao enviar foto para o Cloudinary.');
    } finally {
      setIsUploadingHeroImage(false);
      if (heroImageFileInputRef.current) {
        heroImageFileInputRef.current.value = '';
      }
    }
  }

  function handleHeroImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadHeroImageFile(file);
  }

  async function saveBusinessLogo(logoUrl: string, successMessage: string) {
    const profile = await updateBarbershopProfile({
      name: businessForm.name,
      email: businessForm.email,
      phone: businessForm.phone,
      cnpj: businessForm.cnpj,
      logoUrl,
    });

    setBusinessForm({
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      cnpj: profile.cnpj ?? '',
    });
    setBusinessSlug(profile.slug ?? '');
    setBusinessLogoUrl(profile.logoUrl ?? '');
    persistStoredBarbershop(profile);
    toast.success(successMessage);
  }

  async function uploadBusinessLogoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem.');
      return;
    }

    if (!businessForm.name.trim()) {
      toast.error('Carregue ou informe o nome comercial antes de alterar a logo.');
      return;
    }

    setIsUploadingBusinessLogo(true);

    try {
      const secureUrl = await uploadBusinessLogo(file);
      await saveBusinessLogo(secureUrl, 'Logo atualizada com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao atualizar logo da barbearia.');
    } finally {
      setIsUploadingBusinessLogo(false);
      if (businessLogoFileInputRef.current) {
        businessLogoFileInputRef.current.value = '';
      }
    }
  }

  function handleBusinessLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadBusinessLogoFile(file);
  }

  async function removeBusinessLogo() {
    if (isUploadingBusinessLogo || isLoadingBusinessProfile) {
      return;
    }

    setIsUploadingBusinessLogo(true);

    try {
      await saveBusinessLogo('', 'Logo removida com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao remover logo da barbearia.');
    } finally {
      setIsUploadingBusinessLogo(false);
    }
  }

  async function saveProfilePhoto(photoUrl: string | null, successMessage: string) {
    if (!user?.id) {
      toast.error('Usuario autenticado nao encontrado.');
      return;
    }

    const updatedUser = await updateProfilePhoto(user.id, photoUrl);

    updateUser({
      ...user,
      ...updatedUser,
      photoUrl: updatedUser.photoUrl ?? '',
    });
    setProfilePhotoUrl(updatedUser.photoUrl ?? '');
    toast.success(successMessage);
  }

  async function uploadProfilePhotoFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem.');
      return;
    }

    setIsUploadingProfilePhoto(true);

    try {
      const secureUrl = await uploadProfilePhoto(file);
      await saveProfilePhoto(secureUrl, 'Foto de perfil atualizada com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao atualizar foto de perfil.');
    } finally {
      setIsUploadingProfilePhoto(false);
      if (profilePhotoFileInputRef.current) {
        profilePhotoFileInputRef.current.value = '';
      }
    }
  }

  function handleProfilePhotoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadProfilePhotoFile(file);
  }

  async function removeProfilePhoto() {
    if (isUploadingProfilePhoto) {
      return;
    }

    setIsUploadingProfilePhoto(true);

    try {
      await saveProfilePhoto(null, 'Foto de perfil removida com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao remover foto de perfil.');
    } finally {
      setIsUploadingProfilePhoto(false);
    }
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

  function updateRecipientField<K extends keyof typeof recipientForm>(field: K, value: typeof recipientForm[K]) {
    setRecipientForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveRecipient() {
    const f = recipientForm;
    if (!f.name.trim()) { toast.error('Informe o nome do responsável.'); return; }
    if (!f.document.replace(/\D/g, '')) { toast.error('Informe CPF ou CNPJ.'); return; }
    if (!f.street.trim() || !f.city.trim() || !f.zipCode.replace(/\D/g, '')) {
      toast.error('Preencha os campos de endereço obrigatórios.'); return;
    }
    if (!f.bankHolderName.trim() || !f.accountNumber.trim() || !f.branchNumber.trim()) {
      toast.error('Preencha os dados bancários obrigatórios.'); return;
    }

    const barbershop = getStoredBarbershop();
    if (!barbershop?.id) { toast.error('Barbearia não encontrada.'); return; }

    const phoneDigits = f.phone.replace(/\D/g, '');
    const payload = {
      barbershopId: barbershop.id,
      linkBarbershop: true as const,
      ...(pagarmeRecipientId ? { recipientId: pagarmeRecipientId } : {}),
      register_information: {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        type: f.type,
        document: f.document.replace(/\D/g, ''),
        birthdate: f.birthdate ? f.birthdate.split('-').reverse().join('/') : undefined,
        monthly_income: f.monthlyIncome ? Number(f.monthlyIncome.replace(/\D/g, '')) : undefined,
        professional_occupation: f.professionalOccupation.trim() || undefined,
        phone_numbers: phoneDigits ? [{ ddd: phoneDigits.slice(0, 2), number: phoneDigits.slice(2), type: 'mobile' }] : [],
        address: {
          street: f.street.trim(),
          street_number: f.streetNumber.trim(),
          complementary: f.complementary.trim() || undefined,
          neighborhood: f.neighborhood.trim(),
          city: f.city.trim(),
          state: f.state.trim(),
          zip_code: f.zipCode.replace(/\D/g, ''),
          reference_point: f.referencePoint.trim() || undefined,
        },
      },
      default_bank_account: {
        holder_name: f.bankHolderName.trim(),
        holder_type: f.bankHolderType,
        holder_document: f.bankHolderDocument.replace(/\D/g, ''),
        bank: f.bank.replace(/\D/g, ''),
        branch_number: f.branchNumber.replace(/\D/g, ''),
        branch_check_digit: f.branchCheckDigit.replace(/\D/g, '') || undefined,
        account_number: f.accountNumber.replace(/\D/g, ''),
        account_check_digit: f.accountCheckDigit.replace(/\D/g, ''),
        type: 'checking' as const,
      },
    };

    setIsSavingRecipient(true);
    try {
      let recipient;
      if (pagarmeRecipientId) {
        recipient = await updatePagarmeRecipient(pagarmeRecipientId, payload as any);
        toast.success('Recebedor atualizado com sucesso.');
      } else {
        recipient = await createPagarmeRecipient(payload);
        toast.success('Recebedor cadastrado com sucesso.');
      }
      setPagarmeRecipientId(recipient?.id ?? null);
      setPagarmeRecipientStatus(recipient?.status ?? null);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar recebedor Pagar.me.');
    } finally {
      setIsSavingRecipient(false);
    }
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
          logoUrl: businessLogoUrl,
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
      setBusinessLogoUrl(profile.logoUrl ?? '');
      persistStoredBarbershop(profile);
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

  async function saveAppearanceSettings() {
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

    setIsSavingGeneralSettings(true);

    try {
      const [profile, updatedHomeInfo] = await Promise.all([
        updateBarbershopProfile({
          name: businessForm.name,
          email: businessForm.email,
          phone: businessForm.phone,
          cnpj: businessForm.cnpj,
          logoUrl: businessLogoUrl,
        }),
        updateHomeInfo({
          ...(homeInfo ?? {}),
          ...trimmedHeroForm,
        }),
      ]);

      setBusinessForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        cnpj: profile.cnpj ?? '',
      });
      setBusinessSlug(profile.slug ?? '');
      setBusinessLogoUrl(profile.logoUrl ?? '');
      persistStoredBarbershop(profile);
      setHomeInfo(updatedHomeInfo);
      setHeroForm({
        hero_title: updatedHomeInfo.hero_title ?? '',
        hero_subtitle: updatedHomeInfo.hero_subtitle ?? '',
        hero_images: getHeroImages(updatedHomeInfo),
      });
      setHeroImageUrl('');
      toast.success('Aparencia salva com sucesso.');
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar configuracoes de aparencia.');
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

  async function saveTermsDocument(
    termsDocumentUrl: string,
    termsDocumentName: string,
    successMessage: string
  ) {
    if (!canManageSecurityDocuments) {
      toast.error('Apenas administradores podem alterar documentos.');
      return;
    }

    setIsSavingSecuritySettings(true);

    try {
      const currentSettings = settings ?? await getSettings();
      const updatedSettings = await updateSettings({
        pixKey: currentSettings.pixKey ?? '',
        termsDocumentUrl,
        termsDocumentName,
        hiddenBookingPaymentMethods:
          currentSettings.hiddenBookingPaymentMethods ?? getHiddenBookingPaymentMethods(),
      });

      setSettings(updatedSettings);
      toast.success(successMessage);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao salvar documento.');
    } finally {
      setIsSavingSecuritySettings(false);
    }
  }

  async function uploadTermsDocumentFile(file: File) {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      toast.error('Selecione apenas arquivos PDF.');
      return;
    }

    setIsUploadingTermsDocument(true);

    try {
      const secureUrl = await uploadPdf(file);
      await saveTermsDocument(
        secureUrl,
        file.name,
        'Documento de termos atualizado com sucesso.'
      );
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || 'Erro ao enviar PDF.');
    } finally {
      setIsUploadingTermsDocument(false);
      if (termsDocumentFileInputRef.current) {
        termsDocumentFileInputRef.current.value = '';
      }
    }
  }

  function handleTermsDocumentFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadTermsDocumentFile(file);
  }

  function removeTermsDocument() {
    void saveTermsDocument('', '', 'Documento de termos removido com sucesso.');
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
        <TabsList className={`grid w-full lg:w-auto ${isAdmin ? 'grid-cols-5' : 'grid-cols-6'}`}>
          <TabsTrigger value="general" className="gap-2">
            <Store size={14} />
            <span className="hidden sm:inline">Configurações Gerais</span>
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={14} />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="gap-2">
            <Shield size={14} />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard size={14} />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="email" className="gap-2">
              <Mail size={14} />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="gap-2">
            <Palette size={14} />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="meuPlano" className="gap-2">
              <ClipboardList size={14} />
              <span className="hidden sm:inline">Meu Plano</span>
            </TabsTrigger>
          )}
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
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveBarbershopData}
                disabled={isSavingBarbershopData || isLoadingBusinessProfile}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingBarbershopData ? 'Salvando...' : 'Salvar informações'}
              </button>
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
                isSavingGeneralSettings ||
                isUploadingBusinessLogo ||
                isUploadingHeroImage
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
            <Button
              className="gap-2"
            >
              <Save size={14} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">

          {/* Recebedor Pagar.me */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Recebedor Pagar.me</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre o recebedor da barbearia depois do onboarding inicial. Assim o cadastro
                  da barbearia continua simples e os dados financeiros ficam para a etapa de
                  administração.
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                Recebedor cadastrado:{' '}
                <strong className="text-foreground">{pagarmeRecipientId || 'não criado'}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Status:{' '}
                <strong className={
                  pagarmeRecipientStatus === 'active'
                    ? 'text-emerald-600'
                    : pagarmeRecipientStatus
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
                }>
                  {pagarmeRecipientStatus || 'pendente'}
                </strong>
              </p>
            </div>

            {isLoadingRecipient ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Carregando dados do recebedor...
              </div>
            ) : (
              <div className="space-y-6">

                {/* Campo sempre visível + toggle */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Nome / Razão Social <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientForm.name}
                      onChange={(e) => updateRecipientField('name', e.target.value)}
                      disabled={isSavingRecipient}
                      placeholder="Nome completo ou razão social"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setRecipientExpanded((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${recipientExpanded ? 'rotate-180' : ''}`}
                    />
                    {recipientExpanded ? 'Ocultar campos adicionais' : 'Preencher dados completos'}
                  </button>
                </div>

                {/* Campos expandíveis */}
                {recipientExpanded && (
                  <div className="space-y-6">

                {/* Seção 1: restante dos dados do responsável */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Dados do Responsável</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">E-mail</label>
                      <input type="email" value={recipientForm.email} onChange={(e) => updateRecipientField('email', e.target.value)} disabled={isSavingRecipient} placeholder="email@barbearia.com" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Tipo</label>
                      <select value={recipientForm.type} onChange={(e) => updateRecipientField('type', e.target.value as 'individual' | 'company')} disabled={isSavingRecipient} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60">
                        <option value="individual">Pessoa Física</option>
                        <option value="company">Pessoa Jurídica</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">CPF / CNPJ <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.document} onChange={(e) => updateRecipientField('document', e.target.value.replace(/\D/g, '').slice(0, 14))} disabled={isSavingRecipient} placeholder="Apenas números" maxLength={14} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Telefone</label>
                      <input type="tel" value={recipientForm.phone} onChange={(e) => updateRecipientField('phone', formatPhone(e.target.value))} disabled={isSavingRecipient} placeholder="(00) 00000-0000" maxLength={15} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Data de Nascimento</label>
                      <input type="date" value={recipientForm.birthdate} onChange={(e) => updateRecipientField('birthdate', e.target.value)} disabled={isSavingRecipient} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Renda Mensal (R$)</label>
                      <input type="number" min="0" value={recipientForm.monthlyIncome} onChange={(e) => updateRecipientField('monthlyIncome', e.target.value)} disabled={isSavingRecipient} placeholder="0" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Ocupação Profissional</label>
                      <input type="text" value={recipientForm.professionalOccupation} onChange={(e) => updateRecipientField('professionalOccupation', e.target.value)} disabled={isSavingRecipient} placeholder="Ex: Empresário" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Endereço */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Endereço</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">CEP <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.zipCode} onChange={(e) => updateRecipientField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 8))} disabled={isSavingRecipient} placeholder="00000000" maxLength={8} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Rua <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.street} onChange={(e) => updateRecipientField('street', e.target.value)} disabled={isSavingRecipient} placeholder="Nome da rua" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Número</label>
                      <input type="text" value={recipientForm.streetNumber} onChange={(e) => updateRecipientField('streetNumber', e.target.value)} disabled={isSavingRecipient} placeholder="123" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Complemento</label>
                      <input type="text" value={recipientForm.complementary} onChange={(e) => updateRecipientField('complementary', e.target.value)} disabled={isSavingRecipient} placeholder="Sala, andar..." className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Bairro</label>
                      <input type="text" value={recipientForm.neighborhood} onChange={(e) => updateRecipientField('neighborhood', e.target.value)} disabled={isSavingRecipient} placeholder="Bairro" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Cidade <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.city} onChange={(e) => updateRecipientField('city', e.target.value)} disabled={isSavingRecipient} placeholder="Cidade" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Estado (UF)</label>
                      <input type="text" value={recipientForm.state} onChange={(e) => updateRecipientField('state', e.target.value.toUpperCase().slice(0, 2))} disabled={isSavingRecipient} placeholder="MG" maxLength={2} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Ponto de Referência</label>
                      <input type="text" value={recipientForm.referencePoint} onChange={(e) => updateRecipientField('referencePoint', e.target.value)} disabled={isSavingRecipient} placeholder="Próximo a..." className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                  </div>
                </div>

                {/* Seção 3: Dados bancários */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Dados Bancários</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Nome do Titular <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.bankHolderName} onChange={(e) => updateRecipientField('bankHolderName', e.target.value)} disabled={isSavingRecipient} placeholder="Nome como no banco" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Tipo do Titular</label>
                      <select value={recipientForm.bankHolderType} onChange={(e) => updateRecipientField('bankHolderType', e.target.value as 'individual' | 'company')} disabled={isSavingRecipient} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60">
                        <option value="individual">Pessoa Física</option>
                        <option value="company">Pessoa Jurídica</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">CPF/CNPJ do Titular</label>
                      <input type="text" value={recipientForm.bankHolderDocument} onChange={(e) => updateRecipientField('bankHolderDocument', e.target.value.replace(/\D/g, '').slice(0, 14))} disabled={isSavingRecipient} placeholder="Apenas números" maxLength={14} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Banco (código)</label>
                      <input type="text" value={recipientForm.bank} onChange={(e) => updateRecipientField('bank', e.target.value.replace(/\D/g, '').slice(0, 3))} disabled={isSavingRecipient} placeholder="341" maxLength={3} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Agência <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.branchNumber} onChange={(e) => updateRecipientField('branchNumber', e.target.value.replace(/\D/g, ''))} disabled={isSavingRecipient} placeholder="0001" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Dígito da Agência</label>
                      <input type="text" value={recipientForm.branchCheckDigit} onChange={(e) => updateRecipientField('branchCheckDigit', e.target.value.replace(/\D/g, '').slice(0, 1))} disabled={isSavingRecipient} placeholder="0" maxLength={1} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Conta <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.accountNumber} onChange={(e) => updateRecipientField('accountNumber', e.target.value.replace(/\D/g, ''))} disabled={isSavingRecipient} placeholder="00000" className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Dígito da Conta <span className="text-destructive">*</span></label>
                      <input type="text" value={recipientForm.accountCheckDigit} onChange={(e) => updateRecipientField('accountCheckDigit', e.target.value.replace(/\D/g, '').slice(0, 2))} disabled={isSavingRecipient} placeholder="0" maxLength={2} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    type="button"
                    onClick={saveRecipient}
                    disabled={isSavingRecipient}
                    className="gap-2"
                  >
                    {isSavingRecipient ? (
                      <><Spinner /> Salvando...</>
                    ) : pagarmeRecipientId ? (
                      <><Save size={14} /> Atualizar recebedor</>
                    ) : (
                      <><Save size={14} /> Cadastrar recebedor</>
                    )}
                  </Button>
                </div>
                  </div>
                )}
              </div>
            )}
          </div>

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

          {canManageSecurityDocuments && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    Termos e documentos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Envie o PDF que sera usado como termo ou documento oficial da barbearia.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {settings?.termsDocumentUrl ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {settings.termsDocumentName || 'Documento em PDF'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {settings.termsDocumentUrl}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a
                          href={settings.termsDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={14} />
                          Abrir PDF
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={removeTermsDocument}
                        disabled={isSavingSecuritySettings || isUploadingTermsDocument}
                      >
                        <X size={14} />
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhum PDF enviado.
                  </div>
                )}

                <input
                  ref={termsDocumentFileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleTermsDocumentFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => termsDocumentFileInputRef.current?.click()}
                  disabled={
                    isLoadingSecuritySettings ||
                    isSavingSecuritySettings ||
                    isUploadingTermsDocument
                  }
                >
                  {isUploadingTermsDocument || isSavingSecuritySettings ? (
                    <Spinner />
                  ) : (
                    <Upload size={14} />
                  )}
                  {settings?.termsDocumentUrl ? 'Substituir PDF' : 'Enviar PDF'}
                </Button>
              </div>
            </div>
          )}

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
            <Button
              className="gap-2"
            >
              <Save size={14} />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Foto de perfil</h3>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-secondary">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CircleUserRound size={36} className="text-primary" />
                  </div>
                )}
                {isUploadingProfilePhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Spinner />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input
                  ref={profilePhotoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => profilePhotoFileInputRef.current?.click()}
                    disabled={isUploadingProfilePhoto}
                  >
                    {isUploadingProfilePhoto ? <Spinner /> : <Upload size={14} />}
                    {profilePhotoUrl ? 'Substituir foto' : 'Enviar foto'}
                  </Button>
                  {profilePhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={removeProfilePhoto}
                      disabled={isUploadingProfilePhoto}
                    >
                      <X size={14} />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta imagem aparece no perfil do usuario e no cabecalho do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Logo da empresa</h3>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-secondary">
                {businessLogoUrl ? (
                  <img
                    src={businessLogoUrl}
                    alt="Logo da barbearia"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store size={30} className="text-primary" />
                  </div>
                )}
                {isUploadingBusinessLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <Spinner />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input
                  ref={businessLogoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBusinessLogoFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => businessLogoFileInputRef.current?.click()}
                    disabled={isLoadingBusinessProfile || isUploadingBusinessLogo}
                  >
                    {isUploadingBusinessLogo ? <Spinner /> : <Upload size={14} />}
                    {businessLogoUrl ? 'Substituir Logo' : 'Upload New Logo'}
                  </Button>
                  {businessLogoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={removeBusinessLogo}
                      disabled={isLoadingBusinessProfile || isUploadingBusinessLogo}
                    >
                      <X size={14} />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Envie uma imagem para usar como identidade visual no sistema.
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
                      isUploadingHeroImage ||
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
                      isUploadingHeroImage ||
                      heroForm.hero_images.length >= MAX_HERO_IMAGES
                    }
                  >
                    <Plus size={14} />
                    Adicionar
                  </Button>
                  <input
                    ref={heroImageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => heroImageFileInputRef.current?.click()}
                    disabled={
                      isLoadingHomeInfo ||
                      isSavingGeneralSettings ||
                      isUploadingHeroImage ||
                      heroForm.hero_images.length >= MAX_HERO_IMAGES
                    }
                  >
                    {isUploadingHeroImage ? <Spinner /> : <Upload size={14} />}
                    {isUploadingHeroImage ? 'Enviando...' : 'Enviar foto'}
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
                          disabled={
                            isLoadingHomeInfo ||
                            isSavingGeneralSettings ||
                            isUploadingHeroImage
                          }
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
            <Button
              className="gap-2"
              onClick={saveAppearanceSettings}
              disabled={
                isLoadingBusinessProfile ||
                isLoadingHomeInfo ||
                isSavingGeneralSettings ||
                isUploadingProfilePhoto ||
                isUploadingBusinessLogo ||
                isUploadingHeroImage
              }
            >
              {isSavingGeneralSettings ? <Spinner /> : <Save size={14} />}
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Meu Plano — admin only */}
        {isAdmin && (
          <TabsContent value="meuPlano" className="space-y-6">
            <PlatformSubscriptionTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
