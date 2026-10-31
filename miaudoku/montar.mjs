// "Monta" a página de mudança: só copia a pasta mudou/ para dist/.
import { cpSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
cpSync('mudou', 'dist', { recursive: true });
console.log('pronto: dist/ com o aviso de mudança');
