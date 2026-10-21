import { DEMO_INCIDENTS, DEMO_STATS, isDemoMode } from '../src/lib/demo-data';

describe('DEMO_INCIDENTS', () => {
  test('has 6 items', () => {
    expect(DEMO_INCIDENTS).toHaveLength(6);
  });

  test('all demo incidents have is_demo: true', () => {
    DEMO_INCIDENTS.forEach(incident => {
      expect(incident.is_demo).toBe(true);
    });
  });

  test('all demo incidents have required fields (id, title, category, severity, status)', () => {
    DEMO_INCIDENTS.forEach(incident => {
      expect(incident).toHaveProperty('id');
      expect(incident).toHaveProperty('title');
      expect(incident).toHaveProperty('category');
      expect(incident).toHaveProperty('severity');
      expect(incident).toHaveProperty('status');

      expect(typeof incident.id).toBe('string');
      expect(typeof incident.title).toBe('string');
      expect(incident.id.length).toBeGreaterThan(0);
      expect(incident.title.length).toBeGreaterThan(0);
    });
  });
});

describe('DEMO_STATS', () => {
  test('totals match DEMO_INCIDENTS counts approximately', () => {
    // The total incidents in DEMO_STATS should be >= DEMO_INCIDENTS.length
    // (stats may include historical data beyond the demo incidents shown)
    expect(DEMO_STATS).toBeDefined();
    expect(typeof DEMO_STATS.total_incidents).toBe('number');
    expect(DEMO_STATS.total_incidents).toBeGreaterThanOrEqual(DEMO_INCIDENTS.length);
  });

  test('DEMO_STATS has expected shape', () => {
    expect(DEMO_STATS).toHaveProperty('total_incidents');
    expect(DEMO_STATS).toHaveProperty('active_incidents');
    expect(DEMO_STATS).toHaveProperty('people_affected');
    expect(DEMO_STATS).toHaveProperty('resolved_incidents');
  });
});

describe('isDemoMode', () => {
  test('returns boolean', () => {
    const result = isDemoMode();
    expect(typeof result).toBe('boolean');
  });
});
