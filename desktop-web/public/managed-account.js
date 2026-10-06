// A shared Supabase identity selects a separate on-device workspace per account.
// Patient records never leave localStorage; only auth and shared catalogue data use Supabase.
const managedCatalogConfig = window.NUTRIPEER_COMMUNITY_CONFIG;
const managedCatalogEnabled = Boolean(managedCatalogConfig?.managed && managedCatalogConfig.url && managedCatalogConfig.key);
const localAuthSubmit = window.authSubmit;
const localAuthView = window.auth;
const localLogout = window.logout;
const localCommunityLogout = window.communityLogout;
const localCommunityAuth = window.communityAuth;

function emptyManagedWorkspace() {
  return {
    users: [], session: null, patients: [], appointments: [], diets: [], templates: [],
    measurements: [], foods: [], exchanges: [], recipes: [], exchangePlans: [], labs: [],
  };
}

function readManagedDb(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function ensureManagedArrays(value) {
  const workspace = { ...emptyManagedWorkspace(), ...(value || {}) };
  for (const key of Object.keys(emptyManagedWorkspace())) {
    if (key !== 'session' && !Array.isArray(workspace[key])) workspace[key] = [];
  }
  return workspace;
}

function makeManagedProfile(user, formData) {
  const metadata = user.user_metadata || {};
  const emailName = String(user.email || '').split('@')[0];
  return {
    id: user.id,
    email: user.email || formData.email,
    first: metadata.first_name || formData.first || emailName,
    last: metadata.last_name || formData.last || '',
  };
}

function chooseLocalWorkspace(user, formData) {
  const accountKey = `${LOCAL_KEY_PREFIX}${user.id}`;
  let workspace = readManagedDb(accountKey);
  if (!workspace) {
    workspace = emptyManagedWorkspace();
    const marker = 'nutripeer.desktop.legacy-claim.v1';
    const legacy = readManagedDb(LEGACY_KEY);
    const legacyHasRecords = legacy && ['patients', 'appointments', 'diets', 'templates', 'measurements', 'foods', 'exchanges', 'recipes', 'exchangePlans', 'labs']
      .some((key) => Array.isArray(legacy[key]) && legacy[key].length > 0);

    if (!localStorage.getItem(marker) && legacyHasRecords) {
      const transfer = window.confirm(
        'Bu cihazda eski NutriPeer kayıtları bulundu. Bunları yalnızca bu cihazda, şu an giriş yaptığın hesaba aktarayım mı? Eski kayıtların bir kopyası olduğu gibi korunur; hiçbir danışan verisi sunucuya yüklenmez.',
      );
      workspace.__legacyMigrationDecision = transfer ? user.id : 'declined';
      if (transfer) {
        for (const key of ['patients', 'appointments', 'diets', 'templates', 'measurements', 'foods', 'exchanges', 'recipes', 'exchangePlans', 'labs']) {
          if (Array.isArray(legacy[key])) workspace[key] = legacy[key];
        }
      }
    }
  }

  const migrationDecision = workspace.__legacyMigrationDecision;
  delete workspace.__legacyMigrationDecision;
  const profile = makeManagedProfile(user, formData);
  workspace = ensureManagedArrays(workspace);
  workspace.users = [profile];
  workspace.session = user.id;
  KEY = accountKey;
  db = workspace;
  save();
  if (migrationDecision) localStorage.setItem('nutripeer.desktop.legacy-claim.v1', migrationDecision);
  return accountKey;
}

async function submitManagedAuth(event, registering) {
  if (!managedCatalogEnabled) return localAuthSubmit(event, registering);
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.target));
  const endpoint = registering ? 'signup' : 'token?grant_type=password';
  const requestBody = registering
    ? {
        email: formData.email,
        password: formData.password,
        data: { first_name: formData.first, last_name: formData.last },
      }
    : { email: formData.email, password: formData.password };

  try {
    const response = await fetch(`${managedCatalogConfig.url}/auth/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        apikey: managedCatalogConfig.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.msg || data.message || data.error_description || data.error || 'Hesap isteği başarısız oldu.');
    }
    if (!data.access_token || !data.user?.id) {
      toast('Hesabın oluşturuldu. E-posta doğrulaması gerekiyorsa gelen bağlantıya tıkla, sonra giriş yap.');
      return;
    }

    const session = { ...data, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
    localStorage.setItem('nutripeer.community.auth.v1', JSON.stringify(session));
    chooseLocalWorkspace(data.user, formData);
    authRegistering = false;
    render();
  } catch (error) {
    console.error('NutriPeer account request failed:', error);
    toast(error.message || 'Hesaba bağlanılamadı. İnternet bağlantını kontrol et.');
  }
}

window.authSubmit = submitManagedAuth;
window.auth = function managedAuthView() {
  localAuthView();
  if (!managedCatalogEnabled) return;

  const form = document.querySelector('.loginbox');
  if (!form) return;
  const subtitle = form.querySelector('.sub');
  if (subtitle) {
    subtitle.textContent = authRegistering
      ? 'Bu hesapla ortak kütüphaneye katkı yap. Danışan kayıtların yalnızca bu cihazda saklanır.'
      : 'Hesabına giriş yap. Danışan kayıtların bu cihazdaki hesabına özel kalır.';
  }

  for (const name of ['birth', 'phone', 'grad', 'location']) {
    form.elements[name]?.closest('.field')?.remove();
  }
  if (!authRegistering) {
    const nameField = form.elements.fullname;
    if (nameField) {
      nameField.name = 'email';
      nameField.type = 'email';
      nameField.autocomplete = 'username';
      nameField.closest('.field')?.querySelector('label')?.replaceChildren('E-posta');
    }
  }
};

window.logout = function managedLogout() {
  if (!managedCatalogEnabled) return localLogout();
  db.session = null;
  save();
  localStorage.removeItem('nutripeer.community.auth.v1');
  KEY = 'nutripeer.desktop.pending';
  db = emptyManagedWorkspace();
  authRegistering = false;
  window.auth();
};

window.communityLogout = function managedCommunityLogout() {
  if (managedCatalogEnabled) return window.logout();
  return localCommunityLogout();
};

window.communityAuth = function managedCommunityAuth(mode) {
  if (!managedCatalogEnabled) return localCommunityAuth(mode);
  if (!db.session) return window.auth();
  return window.logout();
};

if (managedCatalogEnabled && !db.session) window.auth();
