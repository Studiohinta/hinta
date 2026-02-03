# Supabase Production Setup

Produktionsredo Supabase-arkitektur - Nordic Minimalist edition.

## 📋 Översikt

Detta är en komplett, produktionsredo Supabase-arkitektur som ersätter localStorage/Blobs-lösningen med en skalbar databas och storage-lösning.

## 🗂️ Filer

1. **`supabase-schema.sql`** - Komplett databasschema med RLS policies
2. **`supabase-storage.sql`** - Storage buckets setup med RLS policies
3. **`database.types.ts`** - TypeScript interfaces som matchar SQL-schemat exakt

## 🚀 Installation

### Steg 1: Skapa Supabase Projekt

1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Skapa nytt projekt (eller använd befintligt)
3. Vänta tills projektet är klart

### Steg 2: Kör Database Schema

**Första gången (rekommenderat):**
1. Gå till **SQL Editor** i Supabase Dashboard
2. Öppna `supabase-schema-initial.sql` (ingen varning)
3. Kopiera hela innehållet
4. Klistra in i SQL Editor
5. Klicka **Run** (eller Cmd/Ctrl + Enter)
6. Verifiera att tabellerna skapades i **Table Editor**

**Om du behöver köra om schema (med DROP statements):**
- Använd `supabase-schema.sql` istället (varningar kan visas - det är säkert)

**Tabeller som skapas:**
- `projects` - Projekt
- `views` - Vyer (overview, facade, floorplan)
- `units` - Lägenheter (med filter-fält: price, rooms, size, status, floor_level)
- `hotspots` - Hotspots på vyer

### Steg 3: Skapa Storage Buckets

1. Gå till **Storage** i Supabase Dashboard
2. Klicka **New bucket**
3. Skapa två buckets:
   - **Name:** `project-assets` (Public: **Yes**)
   - **Name:** `unit-files` (Public: **Yes**)

### Steg 4: Konfigurera Storage Policies

1. Gå till **SQL Editor** i Supabase Dashboard
2. Öppna `supabase-storage.sql`
3. Kopiera hela innehållet
4. Klistra in i SQL Editor
5. Klicka **Run**

**Storage buckets:**
- `project-assets` - Projekt-assets (bilder, vyer, navigation)
- `unit-files` - Unit-filer (PDF:er, dokument)

## 🔒 Säkerhet (RLS Policies)

### Database Tables
- **Public Read:** Alla kan läsa (SELECT)
- **Admin Write/Update/Delete:** Endast autentiserade användare (INSERT, UPDATE, DELETE)

### Storage Buckets
- **Public Read:** Alla kan läsa filer (SELECT)
- **Admin Upload/Update/Delete:** Endast autentiserade användare (INSERT, UPDATE, DELETE)

**Autentisering:** Policies använder `auth.role() = 'authenticated'` vilket kräver Supabase Auth.

## 📊 Databasstruktur

### Projects
```sql
- id (TEXT, PRIMARY KEY)
- name, description, client, organization
- owner_id, status (enum: active|draft|archived)
- navigation_map_image_url
- bostadsvaljaren_active, bostadsvaljaren_activated_at, bostadsvaljaren_expires_at
- created_at, updated_at
```

### Units (Filter-driven)
```sql
- id (TEXT, PRIMARY KEY)
- project_id (FK → projects)
- name, fact_sheet_file_name
- status (enum: for-sale|reserved|sold|forthcoming) ⭐ FILTER
- price (NUMERIC) ⭐ FILTER
- size (NUMERIC, sq m) ⭐ FILTER
- rooms (INTEGER) ⭐ FILTER
- floor_level (INTEGER) ⭐ FILTER
- ancillary_area, lot_size, fee, selections
- created_at, updated_at
```

### Views
```sql
- id (TEXT, PRIMARY KEY)
- project_id (FK → projects)
- type (enum: overview|facade|floorplan)
- title, image_url
- parent_id (FK → views, nullable)
- unit_ids (TEXT[])
- created_at
```

### Hotspots
```sql
- id (TEXT, PRIMARY KEY)
- view_id (FK → views)
- label, type (enum: polygon|info|camera)
- coordinates (JSONB: [[x,y], ...])
- linked_view_id (FK → views, nullable)
- linked_unit_id (FK → units, nullable)
- linked_asset_id, linked_hotspot_ids
- status, color, opacity
- created_at, updated_at
```

## 📝 TypeScript Types

Använd `database.types.ts` för TypeScript-typer som matchar databasstrukturen exakt:

```typescript
import { ProjectsRow, UnitsRow, ViewsRow, HotspotsRow } from './database.types';
import { ProjectsInsert, UnitsInsert, ViewsInsert, HotspotsInsert } from './database.types';
import { ProjectsUpdate, UnitsUpdate, ViewsUpdate, HotspotsUpdate } from './database.types';
```

## 🎯 Key Features

### Nordic Minimalist Design
- **Endast affärskritiska kolumner**
- **Enkla, tydliga typer**
- **Inga onödiga relationer**

### Production-Ready
- ✅ Foreign Keys med CASCADE/SET NULL
- ✅ Indexes för prestanda (särskilt filter-fält)
- ✅ Auto-update triggers för `updated_at`
- ✅ ENUM types för typsäkerhet
- ✅ RLS policies för säkerhet

### Filter-Optimized
Units-tabellen har index på alla filter-fält:
- `status`
- `price`
- `rooms`
- `floor_level`

## 🔄 Migration från localStorage

Detta schema är designat för att ersätta din nuvarande localStorage/Blobs-lösning. Se din befintliga `supabaseDataService.ts` för hur data hämtas/sparas.

## ⚠️ Viktiga Noteringar

1. **Autentisering:** Policies kräver `auth.role() = 'authenticated'`. Se till att Supabase Auth är konfigurerat.

2. **Storage Buckets:** Buckets måste skapas manuellt i Dashboard innan du kör `supabase-storage.sql`.

3. **ENUM Types:** Schema använder PostgreSQL ENUM types för typsäkerhet. Om du uppdaterar enum-värden måste du köra `ALTER TYPE`.

4. **Foreign Keys:** 
   - `units.project_id` → `projects.id` (CASCADE)
   - `views.project_id` → `projects.id` (CASCADE)
   - `hotspots.view_id` → `views.id` (CASCADE)
   - `hotspots.linked_unit_id` → `units.id` (SET NULL)

## ✅ Verifiering

Efter installation, verifiera:

1. **Tables:** Alla 4 tabeller finns i Table Editor
2. **Indexes:** Index finns på filter-fält (units)
3. **RLS:** RLS är enabled på alla tabeller
4. **Policies:** 8 policies finns (2 per tabell: read + write)
5. **Storage:** 2 buckets finns och är public
6. **Storage Policies:** 8 storage policies finns (read + upload/update/delete per bucket)

---

**Status:** ✅ Production-Ready  
**Design:** Nordic Minimalist  
**Focus:** Business Critical Only
