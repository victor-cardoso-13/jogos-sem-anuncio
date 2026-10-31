/**
 * Os 4 gatinhos (desenhados no estilo do jogo, no lugar do emoji 🐱).
 * O jogador escolhe em Conta → "Escolher gatinho"; o padrão é o "creme".
 * A tela usa o desenho escolhido em todo lugar por meio da variável CSS --gato.
 */

export type IdGatinho = 'traco' | 'chapado' | 'creme' | 'sentado';
export const GATINHO_PADRAO: IdGatinho = 'creme';

const CABECA = 'M4.6 9.6 5.2 3.6 9.3 6.4Q12 5.6 14.7 6.4L18.8 3.6 19.4 9.6Q21 12.2 20.5 15.1 19.6 20.3 12 20.6 4.4 20.3 3.5 15.1 3 12.2 4.6 9.6Z';

export const GATINHOS: Record<IdGatinho, { nome: string; svg: string }> = {
  creme: {
    nome: 'Creme',
    svg: `<path d="${CABECA}" fill="#fffaf2" stroke="#3b2f2a" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6.3 6.6 6.6 9M17.7 6.6 17.4 9" stroke="#f4a7b0" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="9.2" cy="12.6" r="1.05" fill="#3b2f2a"/><circle cx="14.8" cy="12.6" r="1.05" fill="#3b2f2a"/>
      <circle cx="7.6" cy="15" r="1.1" fill="#f4c6cc"/><circle cx="16.4" cy="15" r="1.1" fill="#f4c6cc"/>
      <path d="M11.2 14.6h1.6l-.8.9z" fill="#e5848f"/>
      <path d="M2.6 14.2 6 14.8M2.9 16.6 6.1 15.9M21.4 14.2 18 14.8M21.1 16.6 17.9 15.9" stroke="#3b2f2a" stroke-width=".8" stroke-linecap="round"/>`,
  },
  chapado: {
    nome: 'Silhueta',
    svg: `<path d="${CABECA}" fill="#3b2f2a"/>
      <ellipse cx="9.2" cy="12.4" rx="1.25" ry="1.45" fill="#fbf6ee"/><ellipse cx="14.8" cy="12.4" rx="1.25" ry="1.45" fill="#fbf6ee"/>
      <path d="M11.1 14.9h1.8l-.9 1z" fill="#f4a7b0"/>`,
  },
  traco: {
    nome: 'Traço',
    svg: `<path d="${CABECA}" fill="none" stroke="#3b2f2a" stroke-width="1.7" stroke-linejoin="round"/>
      <circle cx="9.2" cy="12.6" r="1.05" fill="#3b2f2a"/><circle cx="14.8" cy="12.6" r="1.05" fill="#3b2f2a"/>
      <path d="M11.2 14.9h1.6l-.8.9z" fill="#3b2f2a"/>
      <path d="M12 15.8q-.9 1.1-2 .5M12 15.8q.9 1.1 2 .5" fill="none" stroke="#3b2f2a" stroke-width="1.1" stroke-linecap="round"/>`,
  },
  sentado: {
    nome: 'Sentado',
    svg: `<path d="M7.3 3.2 9 6.6Q11 6 13 6.6L14.7 3.2 15.4 8Q16.6 9.6 15.9 11.4 18.3 13.8 18 17.9 17.8 20.8 15.2 20.8H8.6Q5.9 20.8 6 18 6.1 14.2 8.1 11.6 7 9.8 7.9 8Z" fill="#3b2f2a"/>
      <path d="M17.4 19.6Q21.8 19.8 21 15.2" fill="none" stroke="#3b2f2a" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="10" cy="9.6" rx=".85" ry="1" fill="#fbf6ee"/><ellipse cx="13" cy="9.6" rx=".85" ry="1" fill="#fbf6ee"/>
      <path d="M10.9 11h1.2l-.6.7z" fill="#f4a7b0"/>`,
  },
};

export const idGatinho = (v: unknown): IdGatinho => (typeof v === 'string' && v in GATINHOS ? (v as IdGatinho) : GATINHO_PADRAO);

/** O desenho como <svg> (para a janela de escolha e para as janelas do jogo). */
export const svgGatinho = (id: IdGatinho, classe = '') =>
  `<svg class="gatinho ${classe}" viewBox="0 0 24 24" aria-hidden="true">${GATINHOS[id].svg}</svg>`;

/** Usa o gatinho escolhido em toda a tela (grade, tutorial, destaques). */
export function aplicarGatinho(id: IdGatinho) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${GATINHOS[id].svg}</svg>`;
  document.documentElement.style.setProperty('--gato', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
}
