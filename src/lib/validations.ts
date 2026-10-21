import { z } from 'zod';

export const reportIncidentSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  category: z.enum([
    'flood',
    'cyclone',
    'fire',
    'infrastructure_damage',
    'medical_assistance',
    'food_water',
    'shelter',
    'other',
  ] as const),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  severity: z.enum(['low', 'moderate', 'high', 'critical'] as const),
  location_name: z
    .string()
    .min(3, 'Location name is required')
    .max(200, 'Location name too long'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional(),
  people_affected: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .nullable()
    .optional(),
  assistance_requested: z
    .string()
    .max(1000)
    .optional(),
  cloudinary_public_id: z.string().optional(),
  cloudinary_url: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const volunteerProfileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  aadhar: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^\d{12}$/.test(val), {
      message: 'Aadhaar number must be exactly 12 digits',
    }),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  availability: z.string().min(3, 'Describe your availability'),
  organization: z.string().max(100).optional(),
});

export const volunteerLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  phoneOrAadhar: z.string().min(4, 'Enter registered phone or Aadhaar number'),
});

export const statusUpdateSchema = z.object({
  new_status: z.enum([
    'unverified',
    'verified',
    'in_progress',
    'resolved',
    'rejected',
  ] as const),
  notes: z.string().max(500).optional(),
});

export type ReportIncidentFormData = z.infer<typeof reportIncidentSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type VolunteerProfileFormData = z.infer<typeof volunteerProfileSchema>;
export type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;
