# Conversor de Markdown a Google Docs

Servicio escrito en TypeScript que convierte contenido Markdown en documentos de Google Docs. Está pensado para integrarse con flujos de trabajo de n8n utilizando las credenciales OAuth de Google ya configuradas en esa plataforma.

## Características
- Implementado con **Node.js** y **Express**
- Convierte Markdown a formato DOCX y lo sube a Google Drive
- Acepta los parámetros `output`, `fileName` y ahora `folderId` para especificar la carpeta de destino en Google Drive
- Preparado para ejecutarse con **pm2**

## Instalación
1. Clona este repositorio y entra en la carpeta
2. Instala dependencias
   ```bash
   npm install
   ```
3. Compila el proyecto
   ```bash
   npm run build
   ```
4. Inicia el servicio con pm2
   ```bash
   pm2 start ecosystem.config.js
   ```

## Uso
Envía una petición `POST` a la raíz del servidor incluyendo un token OAuth válido en la cabecera `Authorization`.

Ejemplo con `curl`:
```bash
curl -X POST http://localhost:3000/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "output": "# Título\nTexto de ejemplo",
    "fileName": "Mi Documento",
    "folderId": "ID_DE_CARPETA"
  }'
```
La respuesta incluye el ID y la URL del documento generado.

## Configuración de pm2
El archivo `ecosystem.config.js` ya está preparado para lanzar el servicio desde `dist/index.js` y registrar los logs en la carpeta `logs`.

## Tecnologías utilizadas
- Node.js 18
- TypeScript
- Express
- Google APIs
- pm2

## Licencia
Este proyecto se distribuye bajo la licencia MIT.
