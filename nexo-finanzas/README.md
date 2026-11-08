# NEXO Finanzas — guía para subir a Hostinger

App en React + TypeScript (Vite). Los datos editables (ingreso mensual, gastos estimados y categorías) se guardan en `api/data.json` mediante `api/data.php`. **No necesitas json-server ni Node en el hosting**: PHP viene en todos los planes de Hostinger.

## 1. Generar la versión para publicar (en tu computadora)
Requiere Node.js 18 o superior.

    npm install
    npm run build

Se crea la carpeta `dist/`, que ya incluye la carpeta `api/`.

## 2. Subir a Hostinger
1. hPanel → **Administrador de archivos** → carpeta `public_html` (o la de tu subdominio).
2. Sube **el contenido** de `dist/` (no la carpeta en sí): `index.html`, `assets/` y `api/`.
3. Abre tu dominio. Cambia el ingreso mensual en Configuración, recarga y comprueba que el valor se mantiene.

Si quieres publicarla en una subcarpeta (por ejemplo `midominio.com/nexo`), sube el contenido de `dist/` dentro de esa carpeta. Ya funciona porque `base` es `./`.

## 3. Si no se guardan los cambios
- Confirma que existe `public_html/api/data.json` y que la carpeta `api` tiene permiso de escritura (755 la carpeta y 644 o 664 el archivo).
- Comprueba que tu dominio usa PHP 7.4 o superior (hPanel → Avanzado → Configuración de PHP).
- Si el servidor no responde, la app guarda en el navegador (localStorage) como respaldo.

## Seguridad
`api/data.php` no pide contraseña: cualquiera que conozca la URL puede modificar esos datos. Está bien para una demo o uso personal. Si lo vas a usar con datos reales, protege la carpeta `api` desde hPanel (Avanzado → Carpetas protegidas con contraseña) o agrega un login.

## Desarrollo local
    npm run dev
Sin PHP local, la app usa localStorage.
