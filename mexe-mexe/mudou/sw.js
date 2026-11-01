// O Mexe-Mexe mudou para https://victor-cardoso-13.github.io/mexe-mexe/ .
// Este "service worker" substitui o do endereço antigo: ele se desinstala,
// apaga só os arquivos guardados do endereço ANTIGO e leva quem estiver aberto para o novo.
const NOVO = 'https://victor-cardoso-13.github.io/mexe-mexe/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', evento => evento.waitUntil((async () => {
  const nomes = await caches.keys();
  const escopo = self.registration.scope; // .../jogos-sem-anuncio/mexe-mexe/
  await Promise.all(nomes.filter(n => n.includes(escopo) || n.includes('/jogos-sem-anuncio/')).map(n => caches.delete(n)));
  await self.registration.unregister();
  const janelas = await self.clients.matchAll({ type: 'window' });
  for (const j of janelas) j.navigate(NOVO);
})()));
