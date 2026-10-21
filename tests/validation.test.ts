import { reportIncidentSchema, loginSchema, signUpSchema } from '../src/lib/validations';

describe('reportIncidentSchema', () => {
  const validIncident = {
    title: 'Flood in downtown area',
    description: 'Major flooding has occurred in the downtown area affecting multiple streets.',
    category: 'flood',
    severity: 'high',
    location_name: 'Downtown',
    latitude: 40.7128,
    longitude: -74.006,
    people_affected: 500,
    contact_name: 'John Doe',
    contact_phone: '555-1234',
  };

  test('valid input passes', () => {
    const result = reportIncidentSchema.safeParse(validIncident);
    expect(result.success).toBe(true);
  });

  test('title too short fails', () => {
    const result = reportIncidentSchema.safeParse({ ...validIncident, title: 'Hi' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find(i => i.path.includes('title'));
      expect(titleError).toBeDefined();
    }
  });

  test('missing required fields fail', () => {
    const result = reportIncidentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('latitude out of range fails', () => {
    const result = reportIncidentSchema.safeParse({ ...validIncident, latitude: 200 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const latError = result.error.issues.find(i => i.path.includes('latitude'));
      expect(latError).toBeDefined();
    }
  });
});

describe('loginSchema', () => {
  test('invalid email fails', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path.includes('email'));
      expect(emailError).toBeDefined();
    }
  });

  test('short password fails', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passError = result.error.issues.find(i => i.path.includes('password'));
      expect(passError).toBeDefined();
    }
  });

  test('valid input passes', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'securepassword' });
    expect(result.success).toBe(true);
  });
});

describe('signUpSchema', () => {
  const validSignUp = {
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'securepassword',
    confirmPassword: 'securepassword',
  };

  test("passwords don't match fails", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: 'differentpassword' });
    expect(result.success).toBe(false);
  });

  test('valid input passes', () => {
    const result = signUpSchema.safeParse(validSignUp);
    expect(result.success).toBe(true);
  });

  test('full name too short fails', () => {
    const result = signUpSchema.safeParse({ ...validSignUp, full_name: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find(i => i.path.includes('full_name'));
      expect(nameError).toBeDefined();
    }
  });
});
