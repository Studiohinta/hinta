# Supabase Storage Setup Guide

För att bilderna ska fungera korrekt behöver du skapa en Storage bucket i Supabase.

## Steg 1: Skapa Storage Bucket

1. Gå till ditt Supabase Dashboard: https://supabase.com/dashboard
2. Välj ditt projekt
3. Gå till **Storage** i vänstermenyn
4. Klicka på **"New bucket"**
5. Fyll i:
   - **Name**: `project-assets`
   - **Public bucket**: ✅ **JA** (viktigt! Så att bilderna kan visas publikt)
6. Klicka på **"Create bucket"**

## Steg 2: Konfigurera Bucket Policies (RLS)

Efter att bucketen är skapad behöver du sätta upp Row Level Security (RLS) policies så att:
- Alla kan **läsa** (public access för bilder)
- Endast autentiserade användare kan **ladda upp** (om du vill ha säkerhet)

### Via Supabase Dashboard:

1. Gå till **Storage** → **Policies** → `project-assets`
2. Klicka på **"New Policy"**

#### Policy 1: Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT` (read)
- **Policy definition**: 
  ```sql
  true
  ```
- Klicka **"Review"** och **"Save policy"**

#### Policy 2: Public Upload (för att tillåta uppladdning från frontend)
- **Policy name**: `Public upload` eller `Upload to project-assets`
- **Allowed operation**: `INSERT` (upload)
- **Applied to**: **`public`** (viktigt! Inte "authenticated" - frontend använder anon key)
- **Policy definition**:
  ```sql
  true
  ```
- Klicka **"Review"** och **"Save policy"**

**⚠️ Viktigt:** Sätt "Applied to" till **`public`**, inte `authenticated`. Frontend-appen använder Supabase `anon` key, så den körs som `anon`-rollen, inte `authenticated`. Om du sätter det till `authenticated` kommer uppladdningar att misslyckas.

### Via SQL Editor (alternativ metod):

Kör detta SQL i Supabase SQL Editor:

```sql
-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public read access for project-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-assets');

-- Policy for public upload (frontend använder anon key)
CREATE POLICY "Public upload to project-assets"
ON storage.objects
FOR INSERT
USING (bucket_id = 'project-assets')
WITH CHECK (bucket_id = 'project-assets');
```

## Steg 3: Testa

Efter att du har satt upp bucketen och policies:

1. Gå till admin-panelen: `http://localhost:3004/admin`
2. Skapa eller redigera ett projekt
3. Lägg till en vy och välj en bild
4. Spara
5. Kontrollera i Supabase Dashboard → **Storage** → `project-assets` att bilden har laddats upp
6. Öppna public viewer-länken och verifiera att bilden visas korrekt

## Struktur

Bilder laddas upp i följande struktur:
```
project-assets/
  ├── projects/
  │   ├── {projectId}/
  │   │   ├── views/          # Vy-bilder
  │   │   ├── navigation/     # Navigationskartor
  │   │   ├── assets/         # Projekt-assets
  │   │   └── units/
  │   │       └── {unitId}/   # Unit-filer
```

## Felsökning

### Problem: "Bucket not found"
- Kontrollera att bucketen heter exakt `project-assets`
- Kontrollera att bucketen är markerad som **Public**

### Problem: "Access denied" eller bilder visas inte
- Kontrollera att RLS policies är satta korrekt
- Verifiera att bucketen är **Public**
- Kontrollera i browser console (F12) för felmeddelanden

### Problem: Bilder laddas upp men visas inte
- Kontrollera att bilden faktiskt finns i Storage
- Verifiera att public URL:en är korrekt (klicka på bilden i Storage för att se public URL)
- Kontrollera CORS-inställningar om du får CORS-fel

## Ytterligare säkerhet (valfritt)

Om du vill ha mer kontroll över vem som kan ladda upp bilder kan du:

1. Använda Supabase Auth och kräva autentisering
2. Lägga till mer specifika policies baserat på användarroller
3. Använda service role key för admin-uppladdningar (inte rekommenderat för client-side)

