export const supabaseProjects = {
  test: {
    ref: "pbqgjfzylnhaiadlpvkq",
    url: "https://pbqgjfzylnhaiadlpvkq.supabase.co",
    // Public project key only; never add secret/service-role keys here.
    publishableKey: "sb_publishable_M4yyCkRkQwpzq4Oyu8pGhw__1BoK79P", // gitleaks:allow -- verified public publishable key; not a server secret
  },
  production: {
    ref: "ammrkpwfznlcbdyrqlkn",
    url: "https://ammrkpwfznlcbdyrqlkn.supabase.co",
    // Public project key only; never add secret/service-role keys here.
    publishableKey: "sb_publishable_KalB4CazeWrfa485belVyQ_W910bYRT", // gitleaks:allow -- verified public publishable key; not a server secret
  },
} as const;
