# Marcela Koury — Dashboard de Ventas

Plataforma de analytics e-commerce que unifica datos de **Medusa v2**, **Google Analytics 4**, **Meta Ads**, un **Events Backend custom** (MongoDB) e **inteligencia artificial** (OpenAI / Anthropic) en un solo dashboard.

---

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (Radix) |
| Charts | Recharts 3 |
| Data Fetching | TanStack React Query 5 |
| E-commerce | Medusa JS SDK 2 |
| IA | OpenAI GPT-4, Anthropic Claude |
| Analytics | Google Analytics Data API (GA4) |
| Ads | Facebook Business SDK (Meta Ads) |
| Tracking | Events Backend custom (Express + MongoDB) |

---

## Paginas del Dashboard

### 1. Comando Central (`/dashboard`)

Vista unificada que cruza datos de todas las fuentes en una sola pantalla:

- **KPIs Ejecutivos** (3 filas): Ingresos, Ventas, Ticket Promedio, ROAS Real, Sesiones GA4, Tasa Rebote, Gasto Meta, Costo por Venta, Vistas de Productos, Checkouts, Tasa Abandono, Conversion Vista-Compra
- **Embudo Completo**: Sesiones GA4 → Eventos Storefront → Vistas Producto → Carrito → Checkout → Orden → Pago → Envio → Entrega
- **Ingresos + Marketing**: Grafico de ingresos diarios + eficiencia de marketing (ROAS Meta reportado vs ROAS real Medusa)
- **Productos**: Top productos + tabla de conversion cruzada (vistas de eventos vs ventas reales de Medusa)
- **Salud de Clientes**: Segmentos por grupo, revenue, recurrencia, riesgo de churn, tasa de retencion
- **Oportunidades Perdidas**: Carritos abandonados + busquedas sin resultados
- **Dispositivos + Ordenes**: Distribucion GA4 por dispositivo + ordenes por estado
- **Alertas Automaticas**: ROAS negativo, abandono alto, busquedas vacias, clientes en riesgo
- **Widget IA**: Recomendaciones contextuales de GPT-4/Claude

### 2. Ordenes (`/dashboard/orders`)

Gestion de ordenes con tabla paginada, filtros por estado, detalle de cada orden.

### 3. Productos (`/dashboard/products`)

Catalogo de productos desde Medusa con metricas de venta.

### 4. Clientes (`/dashboard/customers`)

Lista de clientes con metricas agregadas. Pagina de detalle individual (`/dashboard/customers/[id]`) con historial de compras, LTV, y estado de riesgo.

### 5. Marketing (`/dashboard/marketing`)

Dos secciones:

- **Google Analytics 4**: Sesiones, usuarios, tasa de rebote, compras, fuentes de trafico, distribucion por dispositivo
- **Meta Ads**: Gasto, ROAS, conversiones, CTR, impresiones, clicks, CPC, rendimiento por campana

### 6. Analitica de Eventos (`/dashboard/analytics`)

7 tabs para analisis profundo del comportamiento de usuarios:

| Tab | Contenido |
|-----|-----------|
| Resumen | Total eventos, tipos, fuentes, eventos por dia |
| Funnel | Embudo de conversion multi-paso con tasas |
| Productos | Rendimiento: vistas, clicks, carrito, compras, conversion, ingresos |
| Busquedas | Top busquedas + busquedas sin resultados |
| Abandonos | Checkouts abandonados con detalle (cliente, items, total, ultimo paso) |
| Eventos | Explorer de eventos crudos con filtros (tipo, fuente, cliente) |
| Comportamiento | Analisis por pagina: heatmap de clicks, profundidad de scroll, visibilidad de productos |

### 7. IA Insights (`/dashboard/ai`)

- Seleccion de proveedor (OpenAI GPT-4 o Anthropic Claude)
- Analisis contextual de ventas, clientes, productos y segmentos
- Historial de analisis previos
- Resumen de metricas enviadas al modelo

---

## Features Principales

- **Metricas cruzadas**: ROAS real (Medusa revenue / Meta spend), costo por venta, conversion vista a compra
- **Embudo completo**: Cruza GA4 (sesiones) + Events (interacciones) + Medusa (ordenes) en un solo funnel
- **Heatmap de clicks**: Elementos mas clickeados por pagina + distribucion por dispositivo
- **Profundidad de scroll**: Milestones 25/50/75/100% con drop-off por pagina
- **Visibilidad de productos**: Cuantos productos ven los usuarios vs total en la pagina
- **Alertas automaticas**: ROAS negativo, abandono alto, busquedas sin resultados, clientes en riesgo
- **IA contextual**: Widget de IA en cada pagina que recibe metricas relevantes
- **Tema personalizado**: Color rosa marca (#ff75a8) en toda la plataforma
- **Todo en espanol**: Locale es-AR, moneda ARS, labels en castellano

---

## Variables de Entorno

Crear un archivo `.env.local` en la raiz del proyecto:

```env
# Medusa Backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://tu-backend-medusa.com

# Google Analytics 4 (Service Account)
GOOGLE_CLIENT_EMAIL=tu-cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GA4_PROPERTY_ID=123456789

# Meta Ads (System User Token)
META_ACCESS_TOKEN=tu_system_user_token
META_AD_ACCOUNT_ID=act_1234567890

# Events Backend (Express + MongoDB)
EVENTS_API_URL=https://tu-events-backend.com
EVENTS_API_KEY=tu_api_key

# IA (al menos uno de los dos)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Si | URL del backend Medusa v2 |
| `GOOGLE_CLIENT_EMAIL` | No | Email de la cuenta de servicio de GCP |
| `GOOGLE_PRIVATE_KEY` | No | Clave privada PEM de la cuenta de servicio |
| `GA4_PROPERTY_ID` | No | ID de la propiedad de GA4 |
| `META_ACCESS_TOKEN` | No | Token de System User de Meta Business |
| `META_AD_ACCOUNT_ID` | No | ID de la cuenta publicitaria de Meta |
| `EVENTS_API_URL` | No | URL del events backend (Express + MongoDB) |
| `EVENTS_API_KEY` | No | API Key para autenticacion con el events backend |
| `OPENAI_API_KEY` | No | API Key de OpenAI (GPT-4) |
| `ANTHROPIC_API_KEY` | No | API Key de Anthropic (Claude) |

> Las integraciones opcionales (GA4, Meta, Events, IA) degradan gracefully — si no estan configuradas, esas secciones muestran un mensaje informativo.

---

## Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd marcela-koury-dashboard

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Build de Produccion

```bash
npx next build
```

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── ai/recommend/        # Endpoint de IA (OpenAI/Anthropic)
│   │   ├── analytics/ga4/       # Proxy GA4 (Service Account)
│   │   ├── analytics/meta/      # Proxy Meta Ads
│   │   └── events-proxy/[...path]/ # Proxy al Events Backend
│   ├── dashboard/
│   │   ├── page.tsx             # Comando Central (vista unificada)
│   │   ├── orders/              # Ordenes
│   │   ├── products/            # Productos
│   │   ├── customers/           # Clientes + detalle [id]
│   │   ├── marketing/           # GA4 + Meta Ads
│   │   ├── analytics/           # Eventos + Comportamiento
│   │   └── ai/                  # IA Insights
│   └── login/                   # Autenticacion
├── components/
│   ├── charts/                  # Visualizaciones (Recharts)
│   │   ├── revenue-chart.tsx
│   │   ├── conversion-funnel.tsx
│   │   ├── heatmap-chart.tsx
│   │   ├── scroll-depth-chart.tsx
│   │   ├── product-visibility-chart.tsx
│   │   └── ...
│   ├── dashboard/               # Componentes del dashboard
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── metric-card.tsx
│   │   ├── ai-insight-widget.tsx
│   │   ├── page-url-selector.tsx
│   │   └── ...
│   └── ui/                      # Primitivos shadcn/ui
├── hooks/
│   ├── use-orders.ts            # Hooks Medusa (ordenes)
│   ├── use-customers.ts         # Hooks Medusa (clientes)
│   ├── use-products.ts          # Hooks Medusa (productos)
│   ├── use-events.ts            # Hooks Events Backend
│   ├── use-ga4.ts               # Hooks Google Analytics
│   └── use-meta.ts              # Hooks Meta Ads
├── lib/
│   ├── format.ts                # Formateo (moneda ARS, numeros, fechas)
│   ├── ai-client.ts             # Cliente IA (OpenAI/Anthropic)
│   ├── ai-prompts.ts            # Prompts por pagina
│   ├── medusa.ts                # Medusa SDK config
│   └── utils.ts                 # Utilidades (cn, etc)
└── types/
    └── events.ts                # Tipos del Events Backend
```

---

## Integraciones

### Medusa v2
- Autenticacion JWT (`medusa_auth_token`)
- SDK oficial `@medusajs/js-sdk`
- Endpoints: ordenes, productos, clientes, grupos de clientes

### Events Backend (MongoDB)
- Express + MongoDB con endpoints REST
- Autenticacion por header `X-API-Key`
- Proxy en `/api/events-proxy/[...path]`
- Endpoints: `/stats`, `/stats/funnel`, `/stats/products`, `/stats/search`, `/stats/heatmap`, `/stats/scroll-depth`, `/stats/product-visibility`, `/events`

### Google Analytics 4
- Service Account con Google Analytics Data API
- Metricas: sesiones, usuarios, bounce rate, fuentes de trafico, dispositivos
- Proxy en `/api/analytics/ga4`

### Meta Ads
- Facebook Business SDK con System User Token
- Metricas: gasto, ROAS, conversiones, CTR, CPC, campanas
- Proxy en `/api/analytics/meta`

### IA (OpenAI / Anthropic)
- Provider seleccionable (default: OpenAI)
- Recibe metricas contextuales de la pagina actual
- Genera recomendaciones de negocio en espanol
- Endpoint en `/api/ai/recommend`
