import {
  generateReferenceCode,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  validateImageFile,
} from '../src/lib/utils';

describe('generateReferenceCode', () => {
  test('returns a string starting with RN-', () => {
    const code = generateReferenceCode();
    expect(typeof code).toBe('string');
    expect(code.startsWith('RN-')).toBe(true);
  });

  test('returns unique codes on each call', () => {
    const code1 = generateReferenceCode();
    const code2 = generateReferenceCode();
    expect(code1).not.toBe(code2);
  });
});

describe('CATEGORY_LABELS', () => {
  test('has all 8 categories', () => {
    const expected = [
      'flood',
      'earthquake',
      'fire',
      'medical',
      'shelter',
      'food',
      'infrastructure',
      'other',
    ];
    expected.forEach(cat => {
      expect(CATEGORY_LABELS).toHaveProperty(cat);
      expect(typeof CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBe('string');
    });
    expect(Object.keys(CATEGORY_LABELS).length).toBe(8);
  });
});

describe('SEVERITY_COLORS', () => {
  test('has all 4 severities', () => {
    const expected = ['low', 'medium', 'high', 'critical'];
    expected.forEach(sev => {
      expect(SEVERITY_COLORS).toHaveProperty(sev);
    });
    expect(Object.keys(SEVERITY_COLORS).length).toBe(4);
  });
});

describe('STATUS_COLORS', () => {
  test('has all 5 statuses', () => {
    const expected = ['pending', 'active', 'responding', 'resolved', 'closed'];
    expected.forEach(status => {
      expect(STATUS_COLORS).toHaveProperty(status);
    });
    expect(Object.keys(STATUS_COLORS).length).toBe(5);
  });
});

describe('validateImageFile', () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(['x'.repeat(size)], name, { type });
    return file;
  };

  test('rejects non-image files', () => {
    const file = createMockFile('document.pdf', 'application/pdf', 1024);
    const result = validateImageFile(file);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  test('rejects files over 10MB', () => {
    const tenMBPlusOne = 10 * 1024 * 1024 + 1;
    const file = createMockFile('photo.jpg', 'image/jpeg', tenMBPlusOne);
    const result = validateImageFile(file);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  test('accepts valid JPEG', () => {
    const file = createMockFile('photo.jpg', 'image/jpeg', 1024 * 1024);
    const result = validateImageFile(file);
    expect(result).toBeNull();
  });
});
