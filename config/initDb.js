import db from "./db.js";

const LAWYERS_SEED = [
  {
    id: 'neha-sharma',
    name: 'Neha Sharma, Esq.',
    specialty: 'tenancy',
    specialtyLabel: 'Tenancy & Housing Law',
    avatarText: 'NS',
    rating: '4.9',
    casesHandled: 42,
    winRate: '93%',
    bio: 'Former RERA Counsel. Dedicated to representing tenants against predatory landlords, security deposit withholding, and illegal lockouts.',
    barNumber: 'MAH/123/2012',
    packages: [
      { name: 'Demand Letter & Review', price: '₹15,000', desc: 'Drafting formal notice to landlord and reviewing response.' },
      { name: 'District Court Prep', price: '₹45,000', desc: 'Full evidence compilation, witness sheets, and courtroom rehearsal.' },
      { name: 'Full Litigation Retainer', price: '₹1,80,000', desc: 'Comprehensive court representation and mediation filings.' }
    ],
    verified_cases: [
      { case_type: "Security Deposit Recovery Claim", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Illegal Eviction Notice Defense", year: 2023, court_level: "District Court", role: "Respondent's Counsel" },
      { case_type: "Rent Control Compliance Audit", year: 2023, court_level: "Tribunal", role: "Respondent's Counsel" },
      { case_type: "Habitability Failure & Repair Suit", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
    ]
  },
  {
    id: 'rajesh-kumar',
    name: 'Rajesh Kumar',
    specialty: 'employment',
    specialtyLabel: 'Employment & Labor Law',
    avatarText: 'RK',
    rating: '4.8',
    casesHandled: 67,
    winRate: '91%',
    bio: 'Fierce advocate for freelance designers, contractors, and employees facing unpaid wages, wage theft, misclassification, and overtime violations.',
    barNumber: 'DEL/456/2015',
    packages: [
      { name: 'Freelancer Invoice Recovery', price: '₹25,000', desc: 'Official breach of contract letter and settlement negotiations.' },
      { name: 'Labor Board Filing Support', price: '₹60,000', desc: 'Drafting Labour Court claims and evidence audit.' },
      { name: 'Employment Suit Representation', price: 'Contingency', desc: 'No upfront fee. 30% of recovered settlement.' }
    ],
    verified_cases: [
      { case_type: "Freelance Unpaid Invoice Suit", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Employee Wage & Overtime Misclassification", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
      { case_type: "Covenant Not to Compete Invalidation", year: 2023, court_level: "High Court", role: "Petitioner's Counsel" },
      { case_type: "Severance Package Discrepancy Dispute", year: 2022, court_level: "District Court", role: "Respondent's Counsel" }
    ]
  },
  {
    id: 'priya-desai',
    name: 'Priya Desai',
    specialty: 'contract',
    specialtyLabel: 'Contracts & Freelance',
    avatarText: 'PD',
    rating: '4.9',
    casesHandled: 84,
    winRate: '95%',
    bio: 'Specializes in tech freelance agreements, IP transfers, non-compete clauses, and drafting robust service agreements to prevent litigation.',
    barNumber: 'GUJ/789/2018',
    packages: [
      { name: 'Contract Revision Audit', price: '₹20,000', desc: 'Line-by-line contract review and markup with redlines.' },
      { name: 'Template Suite Bundle', price: '₹40,000', desc: '3 customized client contract templates for your business.' },
      { name: 'Custom Agreement Drafting', price: '₹75,000', desc: 'Full custom contract drafting tailored to your specific project.' }
    ],
    verified_cases: [
      { case_type: "SaaS IP Assignment Breach", year: 2024, court_level: "High Court", role: "Respondent's Counsel" },
      { case_type: "NDA Violation Enforcement Claim", year: 2023, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Contractor Service Default Arbitration", year: 2023, court_level: "Tribunal", role: "Respondent's Counsel" }
    ]
  },
  {
    id: 'amit-patel',
    name: 'Amit Patel',
    specialty: 'consumer',
    specialtyLabel: 'Consumer Protection',
    avatarText: 'AP',
    rating: '4.7',
    casesHandled: 53,
    winRate: '88%',
    bio: 'Helping buyers challenge dishonest dealerships, defective appliances (lemon laws), hidden billing subscriptions, and credit reporting errors.',
    barNumber: 'KAR/234/2014',
    packages: [
      { name: 'Dealer Demand Notice', price: '₹22,000', desc: 'Official letter detailing Lemon Law codes and replacement demand.' },
      { name: 'Consumer Forum Filing Pack', price: '₹50,000', desc: 'Drafting files and evidence binders for consumer arbitration boards.' },
      { name: 'Court Action Retainer', price: '₹1,20,000', desc: 'Filing state civil action against manufacturer or dealer.' }
    ],
    verified_cases: [
      { case_type: "Used Car Dealership Odometer Fraud", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Unfair Subscription Billing Class Action", year: 2023, court_level: "High Court", role: "Petitioner's Counsel" },
      { case_type: "Appliances Lemon Law Compensation Claim", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
      { case_type: "Credit Bureau Reporting Error Settlement", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
    ]
  },
  {
    id: 'samira-patel',
    name: 'Samira Patel',
    specialty: 'tenancy',
    specialtyLabel: 'Tenancy & Housing Law',
    avatarText: 'SP',
    rating: '4.9',
    casesHandled: 31,
    winRate: '94%',
    bio: 'Passionate about housing access. Specializes in habitability issues (mold, water leaks), retaliatory rent hikes, and local rent control disputes.',
    barNumber: 'MAH/567/2016',
    packages: [
      { name: 'Notice of Violation Draft', price: '₹18,000', desc: 'Official notice demanding repairs with code inspector cites.' },
      { name: 'Mediation Representation', price: '₹50,000', desc: 'Preparation and advocacy at voluntary mediation boards.' },
      { name: 'Rent Escrow Filing Support', price: '₹80,000', desc: 'Filing to deposit rent with court until repairs are finished.' }
    ],
    verified_cases: [
      { case_type: "Illegal Lockout & Security Deposit Refund", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Retaliatory Rent Increase Appeal", year: 2023, court_level: "Tribunal", role: "Petitioner's Counsel" },
      { case_type: "Water Intrusion & Black Mold Liability", year: 2022, court_level: "District Court", role: "Petitioner's Counsel" }
    ]
  },
  {
    id: 'vikram-singh',
    name: 'Vikram Singh, Esq.',
    specialty: 'criminal',
    specialtyLabel: 'Criminal Defense',
    avatarText: 'VS',
    rating: '4.8',
    casesHandled: 92,
    winRate: '90%',
    bio: 'Providing aggressive representation for criminal defense. Specialized in theft, traffic violations, misdemeanors, and civil rights disputes.',
    barNumber: 'UP/890/2010',
    packages: [
      { name: 'Arrest & Bail consultation', price: '₹30,000', desc: 'Urgent consultation on legal rights and bail structure.' },
      { name: 'Trial Defense Retainer', price: '₹2,50,000', desc: 'Court appearance defense and discovery audit.' }
    ],
    verified_cases: [
      { case_type: "Misdemeanor Theft Charge Dismissal", year: 2024, court_level: "District Court", role: "Respondent's Counsel" },
      { case_type: "First-Offense DUI Citation Appeal", year: 2023, court_level: "District Court", role: "Respondent's Counsel" },
      { case_type: "Search Warrant Evidence Suppression Hearing", year: 2023, court_level: "High Court", role: "Respondent's Counsel" },
      { case_type: "Civil Rights Arrest Warrant Invalidation", year: 2022, court_level: "High Court", role: "Respondent's Counsel" }
    ]
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    specialty: 'family',
    specialtyLabel: 'Family Law & Divorce',
    avatarText: 'PS',
    rating: '4.9',
    casesHandled: 58,
    winRate: '94%',
    bio: 'Compassionate family law attorney. Focused on mutual consent divorce, child custody rights, alimony audits, and marital property settlements.',
    barNumber: 'DEL/112/2017',
    packages: [
      { name: 'Divorce Mediation Consultation', price: '₹25,000', desc: 'Review of mediation steps, asset splits, and child custody rules.' },
      { name: 'Mutual Consent Filing Pack', price: '₹80,000', desc: 'Drafting all mutual separation agreements and court filing support.' }
    ],
    verified_cases: [
      { case_type: "Mutual Separation Agreement Petition", year: 2024, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Joint Custody & Visitation Dispute", year: 2023, court_level: "District Court", role: "Petitioner's Counsel" },
      { case_type: "Alimony Support Revision Appeal", year: 2023, court_level: "High Court", role: "Respondent's Counsel" },
      { case_type: "Marital Asset Partition Dispute", year: 2022, court_level: "Tribunal", role: "Petitioner's Counsel" }
    ]
  }
];

export async function initDb() {
  console.log("Initializing database...");

  // Create lawyers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lawyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      specialty_label TEXT NOT NULL,
      avatar_text TEXT NOT NULL,
      avatar_base64 TEXT,
      rating TEXT NOT NULL,
      cases_handled INTEGER NOT NULL,
      win_rate TEXT NOT NULL,
      bio TEXT NOT NULL,
      bar_number TEXT NOT NULL,
      bar_council_id TEXT,
      verification_status TEXT NOT NULL DEFAULT 'pending',
      password TEXT,
      contact_info TEXT,
      is_visible INTEGER NOT NULL DEFAULT 0,
      packages TEXT NOT NULL, -- JSON string
      verified_cases TEXT NOT NULL, -- JSON string
      is_profile_completed INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Add new columns to existing lawyers table if they don't exist (migration)
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN bar_council_id TEXT`); } catch(_) {}
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending'`); } catch(_) {}
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN password TEXT`); } catch(_) {}
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 0`); } catch(_) {}
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN is_profile_completed INTEGER NOT NULL DEFAULT 0`); } catch(_) {}
  try { await db.execute(`ALTER TABLE lawyers ADD COLUMN contact_info TEXT`); } catch(_) {}

  // Ensure contact uniqueness for lawyers
  try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_lawyers_contact ON lawyers(contact_info)`); } catch(e) { console.warn("Failed to create idx_lawyers_contact:", e.message); }

  // Create clients table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      contact TEXT NOT NULL,
      avatar TEXT,
      interest TEXT NOT NULL,
      password TEXT,
      is_profile_completed INTEGER NOT NULL DEFAULT 0
    )`);
    console.log("Clients table created");

    await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      lawyer_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      brief TEXT,
      date TEXT,
      mode TEXT,
      status TEXT DEFAULT 'New Inquiry',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`);
    console.log("Bookings table created");

  // Add password column to existing clients table if it doesn't exist (migration)
  try { await db.execute(`ALTER TABLE clients ADD COLUMN password TEXT`); } catch(_) {}
  try { await db.execute(`ALTER TABLE clients ADD COLUMN is_profile_completed INTEGER NOT NULL DEFAULT 0`); } catch(_) {}

  // Ensure contact uniqueness for clients
  try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_contact ON clients(contact)`); } catch(e) { console.warn("Failed to create idx_clients_contact:", e.message); }

  console.log("Tables validated / created.");

  // Check if lawyers table has seed data
  const result = await db.execute("SELECT COUNT(*) as count FROM lawyers");
  const count = result.rows[0].count;

  if (count === 0) {
    console.log("Seeding database with default lawyers...");
    for (const lawyer of LAWYERS_SEED) {
      await db.execute({
        sql: `INSERT INTO lawyers (id, name, specialty, specialty_label, avatar_text, avatar_base64, rating, cases_handled, win_rate, bio, bar_number, contact_info, packages, verified_cases, is_profile_completed) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        args: [
          lawyer.id,
          lawyer.name,
          lawyer.specialty,
          lawyer.specialtyLabel,
          lawyer.avatarText,
          lawyer.avatarBase64 || null,
          lawyer.rating,
          lawyer.casesHandled,
          lawyer.winRate,
          lawyer.bio,
          lawyer.barNumber,
          lawyer.contactInfo || null,
          JSON.stringify(lawyer.packages),
          JSON.stringify(lawyer.verified_cases)
        ]
      });
    }
    console.log(`Database seeded successfully with ${LAWYERS_SEED.length} lawyers.`);
  } else {
    console.log(`Database already populated with ${count} lawyers. Skipping seed.`);
  }
}

// Support running directly via script
if (process.argv[1] && process.argv[1].endsWith('initDb.js')) {
  initDb()
    .then(() => {
      console.log("Database init complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database init failed:", err);
      process.exit(1);
    });
}
