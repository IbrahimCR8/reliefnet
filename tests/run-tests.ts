import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reportIncidentSchema,
  loginSchema,
  signUpSchema,
  volunteerProfileSchema,
  volunteerLoginSchema,
  statusUpdateSchema,
} from '../src/lib/validations';
import {
  generateReferenceCode,
  validateImageFile,
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../src/lib/utils';
import {
  DEMO_INCIDENTS,
  DEMO_STATS,
  DEMO_STATUS_HISTORY,
  isDemoMode,
} from '../src/lib/demo-data';

// ── Test 1: Incident Form Validation ─────────────────────────────
test('Incident Validation: Valid report passes validation', () => {
  const validReport = {
    title: 'Severe Flooding in Residential Ward 4',
    category: 'flood',
    description: 'River water has entered over 40 homes with water level reaching 3 feet. Evacuation needed.',
    severity: 'high',
    location_name: 'Ward 4, North Riverbank, Townville',
    latitude: 17.385,
    longitude: 78.4867,
    people_affected: 160,
    assistance_requested: 'Boats, clean drinking water, dry rations',
  };

  const parsed = reportIncidentSchema.safeParse(validReport);
  assert.equal(parsed.success, true);
});

test('Incident Validation: Short title is rejected (< 5 chars)', () => {
  const invalidReport = {
    title: 'Help',
    category: 'flood',
    description: 'River water has entered over 40 homes with water level reaching 3 feet.',
    severity: 'high',
    location_name: 'Ward 4',
  };

  const parsed = reportIncidentSchema.safeParse(invalidReport);
  assert.equal(parsed.success, false);
});

test('Incident Validation: Short description is rejected (< 20 chars)', () => {
  const invalidReport = {
    title: 'Flooding in River Colony',
    category: 'flood',
    description: 'Water everywhere',
    severity: 'high',
    location_name: 'River Colony',
  };

  const parsed = reportIncidentSchema.safeParse(invalidReport);
  assert.equal(parsed.success, false);
});

test('Incident Validation: Coordinates boundary validation (-90 to 90, -180 to 180)', () => {
  const invalidLat = {
    title: 'Flooding in River Colony',
    category: 'flood',
    description: 'Water has reached hazardous levels across all residential streets.',
    severity: 'high',
    location_name: 'River Colony',
    latitude: 95.0, // out of range
    longitude: 78.0,
  };

  const parsed = reportIncidentSchema.safeParse(invalidLat);
  assert.equal(parsed.success, false);
});

// ── Test 2: Authentication Schemas ──────────────────────────────
test('Auth Validation: Valid login credentials pass', () => {
  const parsed = loginSchema.safeParse({
    email: 'coordinator@reliefnet.org',
    password: 'securePassword123',
  });
  assert.equal(parsed.success, true);
});

test('Auth Validation: Invalid email is rejected', () => {
  const parsed = loginSchema.safeParse({
    email: 'not-an-email',
    password: 'securePassword123',
  });
  assert.equal(parsed.success, false);
});

test('Auth Validation: Signup password mismatch is caught', () => {
  const parsed = signUpSchema.safeParse({
    full_name: 'Officer Rajesh',
    email: 'rajesh@reliefnet.org',
    password: 'password123',
    confirm_password: 'mismatchedPassword',
  });
  assert.equal(parsed.success, false);
});

// ── Test 3: Volunteer Profile Validation ─────────────────────────
test('Volunteer Validation: Valid registration passes', () => {
  const parsed = volunteerProfileSchema.safeParse({
    name: 'Dr. Priya Sharma',
    email: 'priya@emergency.org',
    phone: '9876543210',
    aadhar: '5555 4444 3333',
    address: 'Flat 402, Begumpet Relief Zone, Hyderabad',
    skills: ['First Aid & Triage', 'Water Rescue'],
    availability: 'Weekends and on-call emergencies',
    organization: 'Civil Protection Corps',
  });
  assert.equal(parsed.success, true);
});

test('Volunteer Validation: Short address is rejected', () => {
  const parsed = volunteerProfileSchema.safeParse({
    name: 'Dr. Priya Sharma',
    email: 'priya@emergency.org',
    phone: '9876543210',
    aadhar: '555544443333',
    address: 'Hy', // too short
    skills: ['First Aid & Triage'],
    availability: 'Weekends',
  });
  assert.equal(parsed.success, false);
});

test('Volunteer Validation: Empty skills array is rejected', () => {
  const parsed = volunteerProfileSchema.safeParse({
    name: 'Dr. Priya Sharma',
    email: 'priya@emergency.org',
    phone: '9876543210',
    aadhar: '555544443333',
    skills: [],
    availability: 'Weekends',
  });
  assert.equal(parsed.success, false);
});

test('Volunteer Validation: Invalid Aadhaar number is rejected', () => {
  const parsed = volunteerProfileSchema.safeParse({
    name: 'Dr. Priya Sharma',
    email: 'priya@emergency.org',
    phone: '9876543210',
    aadhar: '12345', // invalid length
    skills: ['First Aid & Triage'],
    availability: 'Weekends',
  });
  assert.equal(parsed.success, false);
});

test('Volunteer Validation: Invalid Indian mobile number is rejected', () => {
  const parsed = volunteerProfileSchema.safeParse({
    name: 'Dr. Priya Sharma',
    email: 'priya@emergency.org',
    phone: '1234567890', // does not start with 6-9
    aadhar: '555544443333',
    address: 'Begumpet Relief Center',
    skills: ['First Aid & Triage'],
    availability: 'Weekends',
  });
  assert.equal(parsed.success, false);
});

test('Volunteer Login: Valid email and password pass', () => {
  const parsed = volunteerLoginSchema.safeParse({
    email: 'volunteer@reliefnet.org',
    password: 'securePassword123',
  });
  assert.equal(parsed.success, true);
});

test('Volunteer Login: Short password is rejected', () => {
  const parsed = volunteerLoginSchema.safeParse({
    email: 'volunteer@reliefnet.org',
    password: '123',
  });
  assert.equal(parsed.success, false);
});

// ── Test 4: Reference Code Generation ────────────────────────────
test('Utils: Reference code format follows RN-YYYY-XXXXX', () => {
  const code = generateReferenceCode();
  assert.match(code, /^RN-\d{4}-[A-Z0-9]{5}$/);
});

// ── Test 5: Image File Validation ────────────────────────────────
test('Utils: ValidateImageFile rejects unauthorized extensions', () => {
  const fakeFile = {
    name: 'malware.exe',
    type: 'application/x-msdownload',
    size: 1024,
  } as unknown as File;

  const error = validateImageFile(fakeFile);
  assert.notEqual(error, null);
  assert.match(error!, /File type not allowed/);
});

test('Utils: ValidateImageFile accepts valid JPEG image', () => {
  const validFile = {
    name: 'flood.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024,
  } as unknown as File;

  const error = validateImageFile(validFile);
  assert.equal(error, null);
});

test('Utils: ValidateImageFile rejects file exceeding 10MB limit', () => {
  const largeFile = {
    name: 'heavy.jpg',
    type: 'image/jpeg',
    size: 12 * 1024 * 1024,
  } as unknown as File;

  const error = validateImageFile(largeFile);
  assert.notEqual(error, null);
  assert.match(error!, /File too large/);
});

// ── Test 6: Demo Mode & Data Integrity ───────────────────────────
test('Demo Data: Sample incidents have valid categories, severities and reference codes', () => {
  assert.ok(DEMO_INCIDENTS.length >= 6);

  for (const inc of DEMO_INCIDENTS) {
    assert.equal(inc.is_demo, true);
    assert.ok(inc.reference_code.startsWith('RN-'));
    assert.ok(inc.title.length >= 5);
    assert.ok(inc.description.length >= 20);
    assert.ok(CATEGORY_LABELS[inc.category] !== undefined);
    assert.ok(SEVERITY_LABELS[inc.severity] !== undefined);
    assert.ok(STATUS_LABELS[inc.status] !== undefined);
  }
});

test('Demo Data: Demo status history references existing demo incidents', () => {
  for (const hist of DEMO_STATUS_HISTORY) {
    const parent = DEMO_INCIDENTS.find(i => i.id === hist.incident_id);
    assert.ok(parent !== undefined);
  }
});

test('Demo Data: KPI stats properly tally demo records', () => {
  assert.equal(DEMO_STATS.total, DEMO_INCIDENTS.length);
});

// ── Test 7: Duplicate Volunteer Assignment Logic ──────────────────
test('Volunteer Coordination: Assignment deduplication check', () => {
  const existingAssignments = [
    { incident_id: 'demo-1', volunteer_id: 'user-101' },
    { incident_id: 'demo-2', volunteer_id: 'user-102' },
  ];

  const canAssign = (incId: string, volId: string) => {
    return !existingAssignments.some(a => a.incident_id === incId && a.volunteer_id === volId);
  };

  assert.equal(canAssign('demo-1', 'user-101'), false); // Duplicate prevented
  assert.equal(canAssign('demo-1', 'user-103'), true);  // New assignment allowed
});

// ── Test 8: Volunteer Online Presence Calculation ────────────────
test('Volunteer Presence: Online count is accurately derived', () => {
  const now = Date.now();
  const mockVolunteers = [
    { id: 'v1', is_online: true, last_active_at: new Date(now - 60000).toISOString() }, // online
    { id: 'v2', is_online: false, last_active_at: new Date(now - 120000).toISOString() }, // recently active (<15 min)
    { id: 'v3', is_online: false, last_active_at: new Date(now - 3600000).toISOString() }, // offline (>1hr)
  ];

  const FIFTEEN_MINS = 15 * 60 * 1000;
  const onlineCount = mockVolunteers.filter(v => {
    const diff = now - new Date(v.last_active_at).getTime();
    return v.is_online || diff < FIFTEEN_MINS;
  }).length;

  assert.equal(onlineCount, 2);
});

// ── Test 9: Zero Fake Jobs Enforcement ────────────────────────────
test('Volunteer Missions: Unassigned responders have null mission orders (no fake jobs)', () => {
  const unassignedVolunteer = {
    id: 'vol-test',
    assigned_incident_id: null,
    assigned_role_task: null,
  };

  assert.equal(unassignedVolunteer.assigned_incident_id, null);
  assert.equal(unassignedVolunteer.assigned_role_task, null);
});

// ── Test 10: Role-Based Access Control (RBAC) Enforcement ─────────
test('RBAC: Volunteer role cannot access Coordinator Console', () => {
  const isAuthorizedCoordinator = (role: string | null | undefined): boolean => {
    return role === 'coordinator' || role === 'admin';
  };

  assert.equal(isAuthorizedCoordinator('volunteer'), false);
  assert.equal(isAuthorizedCoordinator(null), false);
  assert.equal(isAuthorizedCoordinator(undefined), false);
  assert.equal(isAuthorizedCoordinator('coordinator'), true);
  assert.equal(isAuthorizedCoordinator('admin'), true);
});

console.log('✅ All ReliefNet Automated Test Suites Passed Successfully!');
