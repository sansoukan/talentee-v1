import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ⚠️ URL et clé service_role doivent être dans .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local");
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seedProfiles() {
  // 1. Récupérer les users existants
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Erreur récupération users:", listError);
    return;
  }

  console.log(`🔎 ${users.users.length} utilisateurs trouvés dans auth.users`);

  // 2. Créer ou mettre à jour un profil pour chaque user
  for (const u of users.users) {
    const profile = {
      id: u.id, // 👈 FK vers auth.users.id
      career_stage: "student",
      domain: "general",
      goal: "practice",
      onboarding_completed: false,
      nom: u.user_metadata?.nom || `Nom${u.id.slice(0, 4)}`,
      prenom: u.user_metadata?.prenom || `Prenom${u.id.slice(0, 4)}`,
      role: "user",
    };

    const { error } = await supabase.from("profiles").upsert(profile);

    if (error) {
      console.error(`❌ Erreur profil user ${u.id}`);
      console.error("   Code:", error.code || "N/A");
      console.error("   Message:", error.message || "N/A");
      console.error("   Details:", error.details || "N/A");
      console.error("   Hint:", error.hint || "N/A");
    } else {
      console.log(`✅ Profil inséré/mis à jour pour user ${u.id}`);
    }
  }
}

seedProfiles();
