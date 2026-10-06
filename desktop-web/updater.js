import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

function addUpdateButton() {
  if (!window.__TAURI_INTERNALS__) return;
  const sidebar = document.querySelector('.side');
  if (!sidebar || document.querySelector('#nutripeer-update-button')) return;

  const button = document.createElement('button');
  button.id = 'nutripeer-update-button';
  button.className = 'btn light small';
  button.type = 'button';
  button.textContent = 'Güncellemeleri kontrol et';
  button.style.margin = '0 8px';
  if (!window.NUTRIPEER_UPDATER_ENABLED) {
    button.disabled = true;
    button.textContent = 'Güncellemeler henüz ayarlanmadı';
    button.title = 'Updater imza anahtarı ve yayın adresi gerekli.';
  }
  let availableUpdate = null;
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Kontrol ediliyor…';
    try {
      const update = availableUpdate || await check();
      availableUpdate = null;
      if (!update) {
        window.alert('NutriPeer güncel.');
        return;
      }
      const notes = update.body ? `\n\n${update.body}` : '';
      if (!window.confirm(`${update.version} sürümü hazır.${notes}\n\nŞimdi indirip kurulsun mu?`)) return;
      button.textContent = 'Güncelleme indiriliyor…';
      await update.downloadAndInstall();
      await relaunch();
    } catch (error) {
      console.error('NutriPeer update check failed:', error);
      window.alert('Güncelleme şu anda kontrol edilemedi. İnternet bağlantısını ve güncelleme ayarlarını kontrol edin.');
    } finally {
      button.disabled = false;
      button.textContent = 'Güncellemeleri kontrol et';
    }
  });
  sidebar.append(button);
  if (window.NUTRIPEER_UPDATER_ENABLED) {
    window.setTimeout(async () => {
      try {
        availableUpdate = await check();
        if (availableUpdate) button.textContent = `Güncelleme hazır · ${availableUpdate.version}`;
      } catch (error) {
        console.info('NutriPeer update check skipped:', error);
      }
    }, 3000);
  }
}

addUpdateButton();
new MutationObserver(addUpdateButton).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
