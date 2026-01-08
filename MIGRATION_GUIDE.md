# Migration Guide: localStorage → Supabase

## Step 1: Install Dependencies

The Supabase package has been installed. You should see `@supabase/supabase-js` in your `package.json`.

## Step 2: Set Up Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use an existing one
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run Database Schema

1. Go to your Supabase project → **SQL Editor**
2. Open the file `supabase-schema.sql` in this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click **Run** to create all tables

## Step 5: Update App.tsx

The App.tsx file needs to be updated to use the DataContext. Here's what needs to change:

### Key Changes:

1. **Wrap App with DataProvider**:
   ```tsx
   <DataProvider>
     <App />
   </DataProvider>
   ```

2. **Replace localStorage hooks with useData()**:
   ```tsx
   // OLD:
   const [projects, setProjects] = useDemoStorage<Project[]>('hinta_projects', []);
   
   // NEW:
   const { projects, fetchProjects, createProject, updateProject, deleteProject } = useData();
   ```

3. **Load data on mount**:
   ```tsx
   useEffect(() => {
     fetchProjects();
   }, [fetchProjects]);
   ```

4. **Update all CRUD operations** to use context methods instead of localStorage

## Step 6: Test the Migration

1. Start your dev server: `npm run dev`
2. Log in to the admin panel
3. Create a new project
4. Add views and hotspots
5. Check your Supabase dashboard to verify data is being saved
6. Visit the public viewer link to ensure data loads correctly

## Important Notes

- **Real-time Updates**: The current implementation saves immediately when you draw hotspots. Changes should appear instantly in the public viewer.
- **Data Migration**: If you have existing localStorage data, you may want to create a migration script to import it into Supabase.
- **RLS Policies**: The current schema allows all operations. In production, you should tighten Row Level Security policies based on your authentication requirements.

## Troubleshooting

- **"Supabase credentials not found"**: Make sure your `.env` file is in the root directory and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **"Error fetching projects"**: Check that you've run the SQL schema and that your Supabase project is active
- **Data not saving**: Check the browser console for errors and verify your RLS policies allow INSERT/UPDATE operations

