import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Application,
  ApplicationComment,
  ApplicationDocument,
  ApplicationStatus,
  ApplicationStatusHistory,
  ApplicationVersion,
  AppRole,
  CorrectionRequest,
  DocumentCategory,
  InPortalNotification,
  Inventor,
  Profile,
} from '../types/database.types';
import { canTransition } from '../features/applications/workflow';
import {
  COORDINATOR,
  DEMO_PERSONAS,
  INSTITUTION,
  SECURITY_RULES,
} from '../config/constants';

// Key for local persistent mock when live Supabase credentials are not connected
const STORAGE_PREFIX = 'muj_patent_portal_';

// Maximum upload file size from centralized security rules
export const MAX_DOCUMENT_SIZE_BYTES = SECURITY_RULES.MAX_FILE_SIZE_BYTES;

// Allowed MIME types
export const ALLOWED_DOCUMENT_MIMES = [
  ...SECURITY_RULES.ALLOWED_MIME_TYPES,
  'application/msword',
  'image/jpeg',
];

// Seed initial profiles and sample disclosures using centralized institutional metadata
function initLocalStorageIfNeeded() {
  const initialized = localStorage.getItem(`${STORAGE_PREFIX}initialized`);
  if (!initialized) {
    const adminUser: Profile = {
      id: COORDINATOR.ID,
      university_email: COORDINATOR.EMAIL,
      full_name: COORDINATOR.FULL_NAME,
      role: 'admin',
      department: INSTITUTION.DEPARTMENTS.IPR_CELL,
      registration_number: 'MUJ-FAC-IPR-001',
      phone: '+91 141 3999100',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sampleStudent: Profile = {
      id: DEMO_PERSONAS.STUDENT_ADITYA.id,
      university_email: DEMO_PERSONAS.STUDENT_ADITYA.email,
      full_name: DEMO_PERSONAS.STUDENT_ADITYA.full_name,
      role: 'student',
      department: DEMO_PERSONAS.STUDENT_ADITYA.department,
      registration_number: DEMO_PERSONAS.STUDENT_ADITYA.registration_no,
      phone: DEMO_PERSONAS.STUDENT_ADITYA.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sampleStudentPriya: Profile = {
      id: DEMO_PERSONAS.STUDENT_PRIYA.id,
      university_email: DEMO_PERSONAS.STUDENT_PRIYA.email,
      full_name: DEMO_PERSONAS.STUDENT_PRIYA.full_name,
      role: 'student',
      department: DEMO_PERSONAS.STUDENT_PRIYA.department,
      registration_number: DEMO_PERSONAS.STUDENT_PRIYA.registration_no,
      phone: DEMO_PERSONAS.STUDENT_PRIYA.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const initialProfiles = [adminUser, sampleStudent, sampleStudentPriya];
    localStorage.setItem(`${STORAGE_PREFIX}profiles`, JSON.stringify(initialProfiles));

    // -------------------------------------------------------------------------
    // Seed 1: Submitted Application (Ready for Coordinator Review)
    // -------------------------------------------------------------------------
    const sampleApp1: Application = {
      id: 'app-seed-001',
      reference_number: `${INSTITUTION.SHORT_NAME}-PAT-2026-0001`,
      owner_id: sampleStudent.id,
      title: 'Adaptive Energy Harvesting Micro-Controller for Remote IoT Sensors',
      technical_field: 'Embedded Systems and Renewable Energy',
      background_problem:
        'Remote IoT nodes suffer from finite battery lifetimes requiring frequent physical replacement in harsh outdoor environments.',
      description:
        'An adaptive power-management circuit coupled with multi-source piezoelectric and photovoltaic transducers.',
      novelty_features:
        'A dual-stage hysteretic switching mechanism that dynamically scales impedance matching under varying ambient vibration.',
      practical_applications:
        'Long-range environmental monitoring, agricultural soil sensor grids, and industrial vibration telemetry.',
      status: 'submitted',
      current_version: 1,
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    };

    const sampleInventors1: Inventor[] = [
      {
        id: 'inv-seed-001',
        application_id: sampleApp1.id,
        full_name: DEMO_PERSONAS.STUDENT_ADITYA.full_name,
        email: DEMO_PERSONAS.STUDENT_ADITYA.email,
        phone: DEMO_PERSONAS.STUDENT_ADITYA.phone,
        affiliation_type: 'student',
        department: DEMO_PERSONAS.STUDENT_ADITYA.department,
        is_primary: true,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'inv-seed-002',
        application_id: sampleApp1.id,
        full_name: 'Dr. Anita Joshi',
        email: `anita.joshi${INSTITUTION.EMAIL_AT_DOMAIN}`,
        phone: '+91 9876501234',
        affiliation_type: 'faculty',
        department: 'Electrical Engineering',
        is_primary: false,
        order_index: 1,
        created_at: new Date().toISOString(),
      },
    ];

    const sampleDocs1: ApplicationDocument[] = [
      {
        id: 'doc-seed-001',
        application_id: sampleApp1.id,
        storage_path: `${sampleApp1.id}/complete_specification_v1.pdf`,
        document_category: 'complete_specification',
        original_filename: 'complete_specification_v1.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1420500,
        version_number: 1,
        uploaded_by: sampleStudent.id,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'doc-seed-002',
        application_id: sampleApp1.id,
        storage_path: `${sampleApp1.id}/system_block_diagram.png`,
        document_category: 'drawings',
        original_filename: 'system_block_diagram.png',
        mime_type: 'image/png',
        file_size_bytes: 845200,
        version_number: 1,
        uploaded_by: sampleStudent.id,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    const sampleVersions1: ApplicationVersion[] = [
      {
        id: 'ver-seed-001',
        application_id: sampleApp1.id,
        version_number: 1,
        snapshot_data: { ...sampleApp1, inventors: sampleInventors1 },
        submitted_by: sampleStudent.id,
        submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        submission_notes: 'Initial formal submission for coordinator pre-screening.',
      },
    ];

    const sampleHistory1: ApplicationStatusHistory[] = [
      {
        id: 'hist-seed-001',
        application_id: sampleApp1.id,
        from_status: null,
        to_status: 'draft',
        changed_by: sampleStudent.id,
        reason: 'Initial draft created by student.',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'hist-seed-002',
        application_id: sampleApp1.id,
        from_status: 'draft',
        to_status: 'submitted',
        changed_by: sampleStudent.id,
        reason: 'Submitted for internal review.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    // -------------------------------------------------------------------------
    // Seed 2: Corrections Required Application (Itemized remarks from Dorelal Ji)
    // -------------------------------------------------------------------------
    const sampleApp2: Application = {
      id: 'app-seed-002',
      reference_number: `${INSTITUTION.SHORT_NAME}-PAT-2026-0002`,
      owner_id: sampleStudent.id,
      title: 'Self-Calibrating Multi-Spectral Soil Sensor for Precision Agrotech',
      technical_field: 'Agricultural Engineering & Optoelectronics',
      background_problem:
        'Conventional optical soil spectrometers require periodic lab recalibration due to ambient thermal drift and particulate contamination.',
      description:
        'A sealed probe head integrating dual reference emitters with an internal reflective standard for autonomous calibration in the field.',
      novelty_features:
        'Differential wavelength absorption calculation incorporating ambient humidity correction without external chemical reagents.',
      practical_applications:
        'Automated fertilizer dispensing, greenhouse monitoring, and precision irrigation management.',
      status: 'corrections_required',
      current_version: 1,
      submitted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    };

    const sampleInventors2: Inventor[] = [
      {
        id: 'inv-seed-003',
        application_id: sampleApp2.id,
        full_name: DEMO_PERSONAS.STUDENT_ADITYA.full_name,
        email: DEMO_PERSONAS.STUDENT_ADITYA.email,
        phone: DEMO_PERSONAS.STUDENT_ADITYA.phone,
        affiliation_type: 'student',
        department: DEMO_PERSONAS.STUDENT_ADITYA.department,
        is_primary: true,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
    ];

    const sampleCorrections2: CorrectionRequest[] = [
      {
        id: 'corr-seed-001',
        application_id: sampleApp2.id,
        reviewer_id: COORDINATOR.ID,
        field_name: 'background_problem',
        document_id: null,
        comment: 'Please cite specific comparative prior art regarding thermal drift in commercial optical sensors (e.g. US Pat 9,812,341) to clarify novelty under Section 2(1)(j).',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: null,
      },
      {
        id: 'corr-seed-002',
        application_id: sampleApp2.id,
        reviewer_id: COORDINATOR.ID,
        field_name: 'description',
        document_id: null,
        comment: 'Figure 3 optical probe assembly drawing has low resolution. Please upload a high-resolution vector PDF.',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: null,
      },
    ];

    const sampleHistory2: ApplicationStatusHistory[] = [
      {
        id: 'hist-seed-003',
        application_id: sampleApp2.id,
        from_status: null,
        to_status: 'draft',
        changed_by: sampleStudent.id,
        reason: 'Draft created by applicant.',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: 'hist-seed-004',
        application_id: sampleApp2.id,
        from_status: 'draft',
        to_status: 'submitted',
        changed_by: sampleStudent.id,
        reason: 'Submitted for novelty screening.',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'hist-seed-005',
        application_id: sampleApp2.id,
        from_status: 'submitted',
        to_status: 'corrections_required',
        changed_by: COORDINATOR.ID,
        reason: `${COORDINATOR.FULL_NAME} requested 2 itemized corrections on prior art and drawings.`,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // -------------------------------------------------------------------------
    // Seed 3: Resubmitted Application (Version 2 with Diff Viewer data)
    // -------------------------------------------------------------------------
    const sampleApp3: Application = {
      id: 'app-seed-003',
      reference_number: `${INSTITUTION.SHORT_NAME}-PAT-2026-0003`,
      owner_id: sampleStudentPriya.id,
      title: 'Autonomous Drone-Based Structural Crack Detection & Thermal Imaging System',
      technical_field: 'Computer Vision & Civil Infrastructure Monitoring',
      background_problem:
        'Visual crack inspection on elevated bridge piers requires costly temporary scaffolding and poses significant safety risks.',
      description:
        'An edge-AI drone payload featuring dual RGB-thermal cameras with on-board sub-millimeter crack quantification algorithms.',
      novelty_features:
        'A localized edge inference neural pipeline utilizing synchronized depth and thermal gradient analysis to eliminate false positive shadow detections.',
      practical_applications:
        'Bridge inspection, railway viaduct health monitoring, and high-rise facade assessments.',
      status: 'resubmitted',
      current_version: 2,
      submitted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    };

    const sampleInventors3: Inventor[] = [
      {
        id: 'inv-seed-004',
        application_id: sampleApp3.id,
        full_name: DEMO_PERSONAS.STUDENT_PRIYA.full_name,
        email: DEMO_PERSONAS.STUDENT_PRIYA.email,
        phone: DEMO_PERSONAS.STUDENT_PRIYA.phone,
        affiliation_type: 'student',
        department: DEMO_PERSONAS.STUDENT_PRIYA.department,
        is_primary: true,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
    ];

    const sampleVersions3: ApplicationVersion[] = [
      {
        id: 'ver-seed-002',
        application_id: sampleApp3.id,
        version_number: 1,
        snapshot_data: {
          ...sampleApp3,
          description: 'Basic drone image capture system with post-flight processing.',
          novelty_features: 'General edge detection algorithm on bridge images.',
        },
        submitted_by: sampleStudentPriya.id,
        submitted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        submission_notes: 'Initial disclosure submission.',
      },
      {
        id: 'ver-seed-003',
        application_id: sampleApp3.id,
        version_number: 2,
        snapshot_data: {
          ...sampleApp3,
          inventors: sampleInventors3,
        },
        submitted_by: sampleStudentPriya.id,
        submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        submission_notes: 'Version 2: Expanded novelty description and added thermal gradient cross-validation details.',
      },
    ];

    const sampleHistory3: ApplicationStatusHistory[] = [
      {
        id: 'hist-seed-006',
        application_id: sampleApp3.id,
        from_status: null,
        to_status: 'draft',
        changed_by: sampleStudentPriya.id,
        reason: 'Draft created.',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'hist-seed-007',
        application_id: sampleApp3.id,
        from_status: 'draft',
        to_status: 'submitted',
        changed_by: sampleStudentPriya.id,
        reason: 'Initial submission.',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: 'hist-seed-008',
        application_id: sampleApp3.id,
        from_status: 'submitted',
        to_status: 'corrections_required',
        changed_by: COORDINATOR.ID,
        reason: 'Requested clarification on thermal edge algorithm.',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'hist-seed-009',
        application_id: sampleApp3.id,
        from_status: 'corrections_required',
        to_status: 'resubmitted',
        changed_by: sampleStudentPriya.id,
        reason: 'Applicant resolved all remarks and submitted Version 2.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    // -------------------------------------------------------------------------
    // Seed 4: Approved Application (Forwarded to Statutory Patent Drafting)
    // -------------------------------------------------------------------------
    const sampleApp4: Application = {
      id: 'app-seed-004',
      reference_number: `${INSTITUTION.SHORT_NAME}-PAT-2026-0004`,
      owner_id: sampleStudent.id,
      title: 'Low-Cost Refreshable Braille Haptic Display Actuator Matrix',
      technical_field: 'Assistive Technology & Micro-Electro-Mechanical Systems',
      background_problem:
        'Commercial refreshable Braille displays rely on expensive piezoelectric benders costing over $2,000, rendering them unaffordable for students in developing nations.',
      description:
        'A compact electromagnetic latching mechanism utilizing low-voltage shape memory alloy (SMA) micro-springs to actuate tactile Braille pins with zero continuous holding power.',
      novelty_features:
        'A bistable mechanical magnetic latch holding pin positions without electrical excitation, reducing energy consumption by 94% compared to piezo benders.',
      practical_applications:
        'Affordable educational e-readers for visually impaired students and tactile computer terminals.',
      status: 'approved_next_stage',
      current_version: 1,
      submitted_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    };

    const sampleInventors4: Inventor[] = [
      {
        id: 'inv-seed-005',
        application_id: sampleApp4.id,
        full_name: DEMO_PERSONAS.STUDENT_ADITYA.full_name,
        email: DEMO_PERSONAS.STUDENT_ADITYA.email,
        phone: DEMO_PERSONAS.STUDENT_ADITYA.phone,
        affiliation_type: 'student',
        department: DEMO_PERSONAS.STUDENT_ADITYA.department,
        is_primary: true,
        order_index: 0,
        created_at: new Date().toISOString(),
      },
    ];

    const sampleHistory4: ApplicationStatusHistory[] = [
      {
        id: 'hist-seed-010',
        application_id: sampleApp4.id,
        from_status: 'submitted',
        to_status: 'under_review',
        changed_by: COORDINATOR.ID,
        reason: `${COORDINATOR.FULL_NAME} commenced novelty examination.`,
        created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
      {
        id: 'hist-seed-011',
        application_id: sampleApp4.id,
        from_status: 'under_review',
        to_status: 'approved_next_stage',
        changed_by: COORDINATOR.ID,
        reason: `Approved by ${COORDINATOR.FULL_NAME} for statutory patent filing before Indian Patent Office. University fee sponsorship authorized.`,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
    ];

    const allApps = [sampleApp1, sampleApp2, sampleApp3, sampleApp4];
    const allInventors = [...sampleInventors1, ...sampleInventors2, ...sampleInventors3, ...sampleInventors4];
    const allDocs = [...sampleDocs1];
    const allVersions = [...sampleVersions1, ...sampleVersions3];
    const allHistory = [...sampleHistory1, ...sampleHistory2, ...sampleHistory3, ...sampleHistory4];
    const allCorrections = [...sampleCorrections2];

    localStorage.setItem(`${STORAGE_PREFIX}applications`, JSON.stringify(allApps));
    localStorage.setItem(`${STORAGE_PREFIX}inventors`, JSON.stringify(allInventors));
    localStorage.setItem(`${STORAGE_PREFIX}documents`, JSON.stringify(allDocs));
    localStorage.setItem(`${STORAGE_PREFIX}versions`, JSON.stringify(allVersions));
    localStorage.setItem(`${STORAGE_PREFIX}history`, JSON.stringify(allHistory));
    localStorage.setItem(`${STORAGE_PREFIX}corrections`, JSON.stringify(allCorrections));
    localStorage.setItem(`${STORAGE_PREFIX}comments`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}ref_counter`, '4');
    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
}

// Read helper for local store
function getLocalItem<T>(key: string, defaultValue: T): T {
  initLocalStorageIfNeeded();
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

// Write helper for local store
function setLocalItem<T>(key: string, value: T): void {
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
}

// =============================================================================
// AUTHENTICATION & PROFILES API
// =============================================================================

export async function fetchCurrentProfile(userId: string): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('Supabase fetchCurrentProfile failed, falling back to local store', error);
    } else if (data) {
      return data as Profile;
    }
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  return profiles.find((p) => p.id === userId) || null;
}

export async function upsertProfile(
  profile: Partial<Profile> & { id: string; university_email: string }
): Promise<Profile> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (!error && data) return data as Profile;
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  const index = profiles.findIndex((p) => p.id === profile.id);
  const now = new Date().toISOString();

  let updatedProfile: Profile;
  if (index >= 0) {
    // Preserve existing role to prevent client privilege escalation
    const existingRole = profiles[index].role;
    updatedProfile = {
      ...profiles[index],
      ...profile,
      role: existingRole,
      updated_at: now,
    };
    profiles[index] = updatedProfile;
  } else {
    // Determine default role based on centralized coordinator email
    const cleanEmail = profile.university_email.toLowerCase();
    const isAdminEmail =
      cleanEmail === COORDINATOR.EMAIL.toLowerCase() ||
      cleanEmail === 'patent.admin@muj.manipal.edu';

    updatedProfile = {
      id: profile.id,
      university_email: profile.university_email,
      full_name: profile.full_name || profile.university_email.split('@')[0],
      role: isAdminEmail ? 'admin' : (profile.role || 'student'),
      department: profile.department || null,
      registration_number: profile.registration_number || null,
      phone: profile.phone || null,
      created_at: now,
      updated_at: now,
    };
    profiles.push(updatedProfile);
  }

  setLocalItem('profiles', profiles);
  return updatedProfile;
}

// =============================================================================
// SUPER ADMIN GOVERNANCE & SUPERVISION API (Confidentiality Shielded)
// =============================================================================

export async function fetchAllProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as Profile[];
  }
  return getLocalItem<Profile[]>('profiles', []);
}

export interface ProcessSupervisionItem {
  id: string;
  reference_number: string;
  owner_id: string;
  status: ApplicationStatus;
  current_version: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_department?: string;
}

export async function fetchProcessSupervisionOverview(): Promise<ProcessSupervisionItem[]> {
  if (isSupabaseConfigured()) {
    // Deliberately select ONLY process milestones, applicant department, and timestamps.
    // Confidentiality Shield: Omit trade-secret descriptions, claims, and documents.
    const { data, error } = await supabase
      .from('applications')
      .select('id, reference_number, owner_id, status, current_version, submitted_at, created_at, updated_at, profiles(full_name, university_email, department)')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      return data.map((item: any) => ({
        id: item.id,
        reference_number: item.reference_number,
        owner_id: item.owner_id,
        status: item.status,
        current_version: item.current_version,
        submitted_at: item.submitted_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        applicant_name: item.profiles?.full_name || 'Applicant',
        applicant_email: item.profiles?.university_email || '',
        applicant_department: item.profiles?.department || 'Not specified',
      }));
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const profiles = getLocalItem<Profile[]>('profiles', []);
  return applications.map((app) => {
    const p = profiles.find((prof) => prof.id === app.owner_id);
    return {
      id: app.id,
      reference_number: app.reference_number,
      owner_id: app.owner_id,
      status: app.status,
      current_version: app.current_version,
      submitted_at: app.submitted_at,
      created_at: app.created_at,
      updated_at: app.updated_at,
      applicant_name: p?.full_name || 'Applicant',
      applicant_email: p?.university_email || '',
      applicant_department: p?.department || 'Not specified',
    };
  });
}

export async function superAdminResetUserPassword(
  email: string,
  newPassword: string,
  fullName?: string,
  department?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('register_university_user', {
      p_email: email.trim().toLowerCase(),
      p_password: newPassword,
      p_full_name: fullName || email.split('@')[0],
      p_department: department || null,
    });
    if (error || !data?.success) {
      return { success: false, error: data?.error || error?.message || 'Failed to update user password.' };
    }
    return { success: true };
  }
  return { success: true };
}

export async function superAdminUpdateUserRole(
  userId: string,
  newRole: AppRole
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update user role' };
    }
  }
  const profiles = getLocalItem<Profile[]>('profiles', []);
  const idx = profiles.findIndex((p) => p.id === userId);
  if (idx !== -1) {
    profiles[idx].role = newRole;
    setLocalItem('profiles', profiles);
  }
  return { success: true };
}

export async function fetchSuperAdminTelemetry(): Promise<any> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('get_superadmin_telemetry');
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchSuperAdminTelemetry fallback:', err);
    }
  }
  return null;
}

// =============================================================================
// APPLICATIONS API
// =============================================================================

export async function fetchApplications(user: { id: string; role: AppRole }): Promise<Application[]> {
  if (isSupabaseConfigured()) {
    let query = supabase
      .from('applications')
      .select('*, profiles(*)')
      .order('updated_at', { ascending: false });

    if (user.role !== 'admin') {
      query = query.eq('owner_id', user.id);
    }

    const { data, error } = await query;
    if (!error && data) return data as Application[];
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const profiles = getLocalItem<Profile[]>('profiles', []);

  const results = applications
    .filter((app) => user.role === 'admin' || app.owner_id === user.id)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((app) => {
      const ownerProfile = profiles.find((p) => p.id === app.owner_id);
      return {
        ...app,
        profiles: ownerProfile,
      };
    });

  return results;
}

export async function fetchApplicationById(
  id: string,
  user: { id: string; role: AppRole }
): Promise<Application | null> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('applications')
      .select(
        '*, profiles(*), inventors(*), application_documents(*), correction_requests(*), application_status_history(*)'
      )
      .eq('id', id)
      .single();

    if (!error && data) {
      if (user.role !== 'admin' && data.owner_id !== user.id) {
        throw new Error('Access denied: You do not have permission to view this application.');
      }
      return data as Application;
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const app = applications.find((a) => a.id === id);
  if (!app) return null;

  // Enforce access control
  if (user.role !== 'admin' && app.owner_id !== user.id) {
    throw new Error('Access denied: You do not have permission to view this application.');
  }

  const profiles = getLocalItem<Profile[]>('profiles', []);
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === id);
  const documents = getLocalItem<ApplicationDocument[]>('documents', []).filter((d) => d.application_id === id);
  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []).filter((c) => c.application_id === id);
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []).filter((h) => h.application_id === id);
  const versions = getLocalItem<ApplicationVersion[]>('versions', []).filter((v) => v.application_id === id);

  return {
    ...app,
    profiles: profiles.find((p) => p.id === app.owner_id),
    inventors,
    application_documents: documents,
    correction_requests: corrections,
    application_status_history: history.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    application_versions: versions.sort((a, b) => a.version_number - b.version_number),
  };
}

export async function fetchApplicationVersions(applicationId: string): Promise<ApplicationVersion[]> {
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('application_versions')
      .select('*')
      .eq('application_id', applicationId)
      .order('version_number', { ascending: true });
    if (data) return data as ApplicationVersion[];
  }
  const versions = getLocalItem<ApplicationVersion[]>('versions', []).filter(
    (v) => v.application_id === applicationId
  );
  return versions.sort((a, b) => a.version_number - b.version_number);
}

export async function saveDraftApplication(
  data: Partial<Application>,
  inventorsList: Partial<Inventor>[],
  userId: string
): Promise<Application> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      // Ensure valid UUID for owner_id
      let effectiveUserId = userId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (!isUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.id) {
          effectiveUserId = authUser.user.id;
        }
      }

      // Strip joined relational fields that don't belong to the applications table
      const {
        inventors: _inv,
        profiles: _prof,
        application_documents: _docs,
        correction_requests: _cr,
        application_status_history: _hist,
        application_versions: _ver,
        ...cleanData
      } = data as any;

      let appId = cleanData.id;
      if (!appId) {
        const { data: newApp, error: appError } = await supabase
          .from('applications')
          .insert({
            ...cleanData,
            owner_id: effectiveUserId,
            status: 'draft',
            current_version: 1,
          })
          .select()
          .single();
        if (appError) throw appError;
        appId = newApp.id;
      } else {
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            ...cleanData,
            updated_at: now,
          })
          .eq('id', appId);
        if (updateError) throw updateError;
      }

      // Upsert inventors
      if (inventorsList.length > 0 && appId) {
        await supabase.from('inventors').delete().eq('application_id', appId);
        const inventorsToInsert = inventorsList.map((inv, idx) => ({
          application_id: appId,
          full_name: inv.full_name || '',
          email: inv.email || '',
          phone: inv.phone || null,
          affiliation_type: inv.affiliation_type || 'student',
          department: inv.department || '',
          is_primary: inv.is_primary ?? (idx === 0),
          order_index: idx,
        }));
        await supabase.from('inventors').insert(inventorsToInsert);
      }

      const { data: finalApp } = await supabase
        .from('applications')
        .select('*, inventors(*)')
        .eq('id', appId)
        .single();
      if (finalApp) return finalApp as Application;
    } catch (err) {
      console.warn('Supabase saveDraftApplication fallback to local storage:', err);
    }
  }

  // Local fallback
  const applications = getLocalItem<Application[]>('applications', []);
  const allInventors = getLocalItem<Inventor[]>('inventors', []);
  const counter = parseInt(localStorage.getItem(`${STORAGE_PREFIX}ref_counter`) || '1', 10);

  let targetApp: Application;

  if (data.id) {
    const index = applications.findIndex((a) => a.id === data.id);
    if (index === -1) throw new Error('Application not found');
    if (applications[index].owner_id !== userId) throw new Error('Access denied');

    targetApp = {
      ...applications[index],
      ...data,
      updated_at: now,
    };
    applications[index] = targetApp;
  } else {
    const nextRef = `${INSTITUTION.SHORT_NAME}-PAT-${new Date().getFullYear()}-${String(counter + 1).padStart(4, '0')}`;
    localStorage.setItem(`${STORAGE_PREFIX}ref_counter`, String(counter + 1));

    targetApp = {
      id: `app-${Date.now()}`,
      reference_number: nextRef,
      owner_id: userId,
      title: data.title || 'Untitled Draft Invention',
      technical_field: data.technical_field || '',
      background_problem: data.background_problem || '',
      description: data.description || '',
      novelty_features: data.novelty_features || '',
      practical_applications: data.practical_applications || '',
      status: 'draft',
      current_version: 1,
      submitted_at: null,
      created_at: now,
      updated_at: now,
    };
    applications.push(targetApp);

    // Initial audit entry
    const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
    history.push({
      id: `hist-${Date.now()}`,
      application_id: targetApp.id,
      from_status: null,
      to_status: 'draft',
      changed_by: userId,
      reason: 'Draft created by applicant.',
      created_at: now,
    });
    setLocalItem('history', history);
  }

  // Update inventors
  const filteredInventors = allInventors.filter((i) => i.application_id !== targetApp.id);
  const newInventors: Inventor[] = inventorsList.map((inv, idx) => ({
    id: inv.id || `inv-${Date.now()}-${idx}`,
    application_id: targetApp.id,
    full_name: inv.full_name || '',
    email: inv.email || '',
    phone: inv.phone || null,
    affiliation_type: inv.affiliation_type || 'student',
    department: inv.department || '',
    is_primary: idx === 0,
    order_index: idx,
    created_at: now,
  }));

  setLocalItem('applications', applications);
  setLocalItem('inventors', [...filteredInventors, ...newInventors]);

  return {
    ...targetApp,
    inventors: newInventors,
  };
}

export async function submitApplication(
  applicationId: string,
  userId: string,
  notes?: string
): Promise<Application> {
  const now = new Date().toISOString();

  // Validate permission transition
  if (!canTransition('draft', 'submitted', 'student')) {
    throw new Error('Invalid status transition');
  }

  if (isSupabaseConfigured()) {
    try {
      let effectiveUserId = userId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (!isUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.id) effectiveUserId = authUser.user.id;
      }

      const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        })
        .eq('id', applicationId)
        .select('*, profiles(*), inventors(*)')
        .single();

      if (error) throw error;

      // Archive snapshot
      await supabase.from('application_versions').insert({
        application_id: applicationId,
        version_number: 1,
        snapshot_data: updatedApp,
        submitted_by: effectiveUserId,
        submission_notes: notes || 'Submitted for initial review.',
      });

      // Notify student
      await supabase.from('notifications').insert({
        user_id: effectiveUserId,
        title: 'Application Submitted',
        message: `Your application (${updatedApp.reference_number}) has been submitted for review.`,
        link: `/applications/${applicationId}`,
      });

      return updatedApp as Application;
    } catch (err) {
      console.warn('Supabase submitApplication fallback to local:', err);
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');
  if (applications[index].owner_id !== userId) throw new Error('Access denied');

  const app = applications[index];
  app.status = 'submitted';
  app.submitted_at = now;
  app.updated_at = now;
  applications[index] = app;

  // Record audit history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: 'draft',
    to_status: 'submitted',
    changed_by: userId,
    reason: notes || `Submitted for initial screening by ${COORDINATOR.FULL_NAME}.`,
    created_at: now,
  });

  // Archive version 1
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === applicationId);
  const versions = getLocalItem<ApplicationVersion[]>('versions', []);
  versions.push({
    id: `ver-${Date.now()}`,
    application_id: applicationId,
    version_number: 1,
    snapshot_data: { ...app, inventors },
    submitted_by: userId,
    submitted_at: now,
    submission_notes: notes || 'Submitted for initial screening.',
  });

  // In-portal notification
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  notifications.push({
    id: `notif-${Date.now()}`,
    user_id: userId,
    title: 'Application Submitted Successfully',
    message: `Application reference ${app.reference_number} has been submitted for coordinator review.`,
    link: `/applications/${app.id}`,
    is_read: false,
    created_at: now,
  });

  setLocalItem('applications', applications);
  setLocalItem('history', history);
  setLocalItem('versions', versions);
  setLocalItem('notifications', notifications);

  return { ...app, inventors };
}

export async function resubmitApplication(
  applicationId: string,
  userId: string,
  notes?: string
): Promise<Application> {
  const now = new Date().toISOString();

  if (!canTransition('corrections_required', 'resubmitted', 'student')) {
    throw new Error('Invalid status transition');
  }

  if (isSupabaseConfigured()) {
    try {
      let effectiveUserId = userId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      if (!isUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.id) effectiveUserId = authUser.user.id;
      }

      // Fetch current version
      const { data: currApp } = await supabase
        .from('applications')
        .select('current_version')
        .eq('id', applicationId)
        .single();

      const nextVersion = (currApp?.current_version || 1) + 1;

      // Update application
      const { data: updatedApp, error: appErr } = await supabase
        .from('applications')
        .update({
          status: 'resubmitted',
          current_version: nextVersion,
          updated_at: now,
        })
        .eq('id', applicationId)
        .select('*, profiles(*), inventors(*), application_documents(*), correction_requests(*)')
        .single();

      if (appErr) throw appErr;

      // Mark pending corrections as addressed
      await supabase
        .from('correction_requests')
        .update({ status: 'addressed', resolved_at: now })
        .eq('application_id', applicationId)
        .eq('status', 'pending');

      // Archive new snapshot
      await supabase.from('application_versions').insert({
        application_id: applicationId,
        version_number: nextVersion,
        snapshot_data: updatedApp,
        submitted_by: effectiveUserId,
        submission_notes: notes || `Resubmitted as Version ${nextVersion} with corrections.`,
      });

      // Notify coordinator (admin)
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminProfiles && adminProfiles.length > 0) {
        for (const admin of adminProfiles) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            title: 'Application Resubmitted with Corrections',
            message: `Application ${updatedApp.reference_number} has been updated and resubmitted by the applicant.`,
            link: `/admin/applications/${applicationId}`,
          });
        }
      }

      return updatedApp as Application;
    } catch (err) {
      console.warn('Supabase resubmitApplication fallback to local:', err);
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');
  if (applications[index].owner_id !== userId) throw new Error('Access denied');

  const app = applications[index];
  const oldStatus = app.status;
  const newVersion = app.current_version + 1;

  app.status = 'resubmitted';
  app.current_version = newVersion;
  app.updated_at = now;
  applications[index] = app;

  // Resolve all pending correction requests
  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []);
  const updatedCorrections = corrections.map((c) => {
    if (c.application_id === applicationId && c.status === 'pending') {
      return { ...c, status: 'addressed' as const, resolved_at: now };
    }
    return c;
  });

  // Record audit history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: oldStatus,
    to_status: 'resubmitted',
    changed_by: userId,
    reason: notes || 'Student resubmitted application with requested corrections addressed.',
    created_at: now,
  });

  // Archive new version snapshot
  const inventors = getLocalItem<Inventor[]>('inventors', []).filter((i) => i.application_id === applicationId);
  const versions = getLocalItem<ApplicationVersion[]>('versions', []);
  versions.push({
    id: `ver-${Date.now()}`,
    application_id: applicationId,
    version_number: newVersion,
    snapshot_data: { ...app, inventors },
    submitted_by: userId,
    submitted_at: now,
    submission_notes: notes || `Resubmitted as Version ${newVersion} with corrections.`,
  });

  // Notification for Patent Coordinator (admin)
  const profiles = getLocalItem<Profile[]>('profiles', []);
  const adminProfile = profiles.find((p) => p.role === 'admin');
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);

  if (adminProfile) {
    notifications.push({
      id: `notif-${Date.now()}`,
      user_id: adminProfile.id,
      title: 'Application Resubmitted with Corrections',
      message: `Application ${app.reference_number} has been updated and resubmitted by the applicant.`,
      link: `/admin/applications/${app.id}`,
      is_read: false,
      created_at: now,
    });
  }

  setLocalItem('applications', applications);
  setLocalItem('corrections', updatedCorrections);
  setLocalItem('history', history);
  setLocalItem('versions', versions);
  setLocalItem('notifications', notifications);

  return { ...app, inventors };
}

export async function transitionApplicationStatus(
  applicationId: string,
  toStatus: ApplicationStatus,
  adminUser: { id: string; role: AppRole },
  reason?: string
): Promise<Application> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({
          status: toStatus,
          updated_at: now,
        })
        .eq('id', applicationId)
        .select('*, profiles(*), inventors(*), application_documents(*), correction_requests(*)')
        .single();

      if (!error && updatedApp) {
        if (updatedApp.owner_id) {
          let notificationTitle = 'Application Status Updated';
          let notificationMessage = `Application ${updatedApp.reference_number} status is now: ${toStatus}.`;

          if (toStatus === 'corrections_required') {
            notificationTitle = 'Corrections Requested on Patent Application';
            notificationMessage = `${COORDINATOR.FULL_NAME} has requested specific corrections for ${updatedApp.reference_number}. Please review the feedback.`;
          } else if (toStatus === 'approved_next_stage') {
            notificationTitle = 'Application Approved for Next Stage';
            notificationMessage = `Application ${updatedApp.reference_number} has been approved by ${COORDINATOR.FULL_NAME} for internal patent filing.`;
          }

          await supabase.from('notifications').insert({
            user_id: updatedApp.owner_id,
            title: notificationTitle,
            message: notificationMessage,
            link: `/applications/${updatedApp.id}`,
          });
        }
        return updatedApp as Application;
      }
      if (error) console.warn('Supabase transition status error:', error);
    } catch (err) {
      console.warn('Supabase transitionApplicationStatus fallback to local:', err);
    }
  }

  const applications = getLocalItem<Application[]>('applications', []);
  const index = applications.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error('Application not found');

  const app = applications[index];
  const fromStatus = app.status;

  if (!canTransition(fromStatus, toStatus, adminUser.role)) {
    throw new Error(
      `Unauthorized transition: cannot change status from ${fromStatus} to ${toStatus} as ${adminUser.role}`
    );
  }

  app.status = toStatus;
  app.updated_at = now;
  applications[index] = app;

  // Add to status history
  const history = getLocalItem<ApplicationStatusHistory[]>('history', []);
  history.push({
    id: `hist-${Date.now()}`,
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: adminUser.id,
    reason: reason || `${COORDINATOR.FULL_NAME} updated status to ${toStatus}.`,
    created_at: now,
  });

  // Notify student owner
  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  let notificationTitle = 'Application Status Updated';
  let notificationMessage = `Application ${app.reference_number} status is now: ${toStatus}.`;

  if (toStatus === 'corrections_required') {
    notificationTitle = 'Corrections Requested on Patent Application';
    notificationMessage = `${COORDINATOR.FULL_NAME} has requested specific corrections for ${app.reference_number}. Please review the feedback.`;
  } else if (toStatus === 'approved_next_stage') {
    notificationTitle = 'Application Approved for Next Stage';
    notificationMessage = `Application ${app.reference_number} has been approved by ${COORDINATOR.FULL_NAME} for the next internal filing stage.`;
  }

  notifications.push({
    id: `notif-${Date.now()}`,
    user_id: app.owner_id,
    title: notificationTitle,
    message: notificationMessage,
    link: `/applications/${app.id}`,
    is_read: false,
    created_at: now,
  });

  setLocalItem('applications', applications);
  setLocalItem('history', history);
  setLocalItem('notifications', notifications);

  return app;
}

// =============================================================================
// CORRECTION REQUESTS API
// =============================================================================

export async function createCorrectionRequest(
  applicationId: string,
  reviewerId: string,
  comment: string,
  fieldName?: string | null,
  documentId?: string | null
): Promise<CorrectionRequest> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      let effectiveReviewerId = reviewerId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId);
      if (!isUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.id) effectiveReviewerId = authUser.user.id;
      }

      const { data, error } = await supabase
        .from('correction_requests')
        .insert({
          application_id: applicationId,
          reviewer_id: effectiveReviewerId,
          comment,
          field_name: fieldName || null,
          document_id: documentId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) return data as CorrectionRequest;
      if (error) console.warn('Supabase createCorrectionRequest error:', error);
    } catch (err) {
      console.warn('Supabase createCorrectionRequest fallback to local:', err);
    }
  }

  const corrections = getLocalItem<CorrectionRequest[]>('corrections', []);

  const newRequest: CorrectionRequest = {
    id: `corr-${Date.now()}`,
    application_id: applicationId,
    reviewer_id: reviewerId,
    field_name: fieldName || null,
    document_id: documentId || null,
    comment,
    status: 'pending',
    created_at: now,
    resolved_at: null,
  };

  corrections.push(newRequest);
  setLocalItem('corrections', corrections);
  return newRequest;
}

// =============================================================================
// APPLICATION COMMENTS API
// =============================================================================

export async function addApplicationComment(
  applicationId: string,
  authorId: string,
  content: string,
  commentType: 'general' | 'internal_admin'
): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      let effectiveAuthorId = authorId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId);
      if (!isUuid) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user?.id) effectiveAuthorId = authUser.user.id;
      }

      const { error } = await supabase.from('application_comments').insert({
        application_id: applicationId,
        author_id: effectiveAuthorId,
        comment_type: commentType,
        content,
      });
      if (!error) return;
    } catch (err) {
      console.warn('Supabase addApplicationComment fallback to local:', err);
    }
  }

  const comments = getLocalItem<ApplicationComment[]>('comments', []);
  comments.push({
    id: `comm-${Date.now()}`,
    application_id: applicationId,
    author_id: authorId,
    comment_type: commentType,
    content,
    created_at: now,
  });
  setLocalItem('comments', comments);
}

export async function fetchApplicationComments(applicationId: string, role: AppRole) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('application_comments')
        .select('*, author:profiles(*)')
        .eq('application_id', applicationId);

      if (role !== 'admin') {
        query = query.eq('comment_type', 'general');
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchApplicationComments fallback to local:', err);
    }
  }

  const comments = getLocalItem<any[]>('comments', []).filter((c) => c.application_id === applicationId);
  const profiles = getLocalItem<Profile[]>('profiles', []);

  return comments
    .filter((c) => role === 'admin' || c.comment_type === 'general')
    .map((c) => ({
      ...c,
      author: profiles.find((p) => p.id === c.author_id),
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

// =============================================================================
// PRIVATE DOCUMENT STORAGE API
// =============================================================================

export async function uploadDocument(
  applicationId: string,
  file: File,
  category: DocumentCategory,
  uploaderId: string
): Promise<ApplicationDocument> {
  // 1. File size validation
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(
      `File exceeds maximum permitted size of 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB provided)`
    );
  }

  // 2. MIME type validation
  if (!ALLOWED_DOCUMENT_MIMES.includes(file.type)) {
    throw new Error(
      `Unsupported file type (${file.type}). Permitted types: PDF, DOC, DOCX, PNG, JPEG.`
    );
  }

  // Safe filename sanitization
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${applicationId}/${Date.now()}_${safeFilename}`;
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { error: uploadError } = await supabase.storage
        .from('patent-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        // Ensure uploaderId is valid UUID
        let effectiveUploaderId = uploaderId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uploaderId);
        if (!isUuid) {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user?.id) effectiveUploaderId = authUser.user.id;
        }

        const { data: docRecord, error: docError } = await supabase
          .from('application_documents')
          .insert({
            application_id: applicationId,
            storage_path: storagePath,
            document_category: category,
            original_filename: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
            version_number: 1,
            uploaded_by: effectiveUploaderId,
          })
          .select()
          .single();

        if (!docError && docRecord) {
          return docRecord as ApplicationDocument;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload error, falling back to local metadata:', err);
    }
  }

  // Local storage mock
  const documents = getLocalItem<ApplicationDocument[]>('documents', []);
  const docRecord: ApplicationDocument = {
    id: `doc-${Date.now()}`,
    application_id: applicationId,
    storage_path: storagePath,
    document_category: category,
    original_filename: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    version_number: 1,
    uploaded_by: uploaderId,
    created_at: now,
  };

  documents.push(docRecord);
  setLocalItem('documents', documents);
  return docRecord;
}

export async function downloadSecureDocument(storagePath: string, filename: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { data: blob, error } = await supabase.storage
        .from('patent-documents')
        .download(storagePath);

      if (!error && blob) {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
        return;
      }
      if (error) {
        console.warn('Supabase storage.download error, trying signed url:', error);
      }
    } catch (err) {
      console.warn('Supabase storage.download failed, falling back:', err);
    }

    // Secondary Supabase fallback: signed URL fetched as blob
    try {
      const { data: signedData } = await supabase.storage
        .from('patent-documents')
        .createSignedUrl(storagePath, 900);

      if (signedData?.signedUrl) {
        const response = await fetch(signedData.signedUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
          return;
        }
      }
    } catch (err) {
      console.warn('Supabase signed URL blob fetch failed:', err);
    }
  }

  // Local fallback: create dummy PDF blob
  const mockBlob = new Blob(
    [`%PDF-1.4 Institutional Confidential Patent Document Archive: ${filename}`],
    { type: 'application/pdf' }
  );
  const blobUrl = window.URL.createObjectURL(mockBlob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}

export async function getDocumentSignedUrl(documentPath: string): Promise<string> {
  if (isSupabaseConfigured()) {
    // Generate private signed URL with 15-minute (900 seconds) expiration
    const { data, error } = await supabase.storage
      .from('patent-documents')
      .createSignedUrl(documentPath, 900);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  // Local fallback: create safe mock preview link
  return `data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og...`;
}

export const getSignedDocumentUrl = getDocumentSignedUrl;

export async function deleteDocument(documentId: string, _userId?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('application_documents').delete().eq('id', documentId);
    return;
  }
  const documents = getLocalItem<ApplicationDocument[]>('documents', []);
  setLocalItem('documents', documents.filter((d) => d.id !== documentId));
}

// =============================================================================
// IN-PORTAL NOTIFICATIONS API
// =============================================================================

export async function fetchNotifications(userId: string): Promise<InPortalNotification[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as InPortalNotification[];
  }

  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  return notifications
    .filter((n) => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    return;
  }

  const notifications = getLocalItem<InPortalNotification[]>('notifications', []);
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
    setLocalItem('notifications', notifications);
  }
}
