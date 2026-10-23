'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Shield, Phone } from 'lucide-react';
import { reportIncidentSchema, type ReportIncidentFormData } from '@/lib/validations';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { generateReferenceCode } from '@/lib/utils';
import { PhotoUpload } from '@/components/incidents/PhotoUpload';
import { LocationSearchInput } from '@/components/location/LocationSearchInput';

const CATEGORY_OPTIONS = [
  { value: 'flood', label: 'Flood' },
  { value: 'cyclone', label: 'Cyclone / Severe Storm' },
  { value: 'fire', label: 'Fire' },
  { value: 'infrastructure_damage', label: 'Infrastructure Damage' },
  { value: 'medical_assistance', label: 'Medical Assistance Request' },
  { value: 'food_water', label: 'Food & Water Crisis' },
  { value: 'shelter', label: 'Emergency Shelter Request' },
  { value: 'other', label: 'Other Hazard' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low — Advisory / Monitoring' },
  { value: 'moderate', label: 'Moderate — Non-immediate Hazard' },
  { value: 'high', label: 'High — Urgent Intervention Needed' },
  { value: 'critical', label: 'Critical — Life Threatening Hazard' },
];

export default function ReportPage() {
  const router = useRouter();
  const supabaseReady = isSupabaseConfigured();

  const [uploadedMedia, setUploadedMedia] = useState<{ public_id: string; secure_url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReportIncidentFormData>({
    resolver: zodResolver(reportIncidentSchema),
    defaultValues: {
      severity: 'moderate',
      category: 'flood',
    },
  });

  useEffect(() => {
    register('location_name');
    register('latitude');
    register('longitude');
    register('cloudinary_url');
    register('cloudinary_public_id');
  }, [register]);

  const handlePhotoUploadComplete = (result: { public_id: string; secure_url: string }) => {
    setUploadedMedia(result);
    setValue('cloudinary_public_id', result.public_id, { shouldValidate: true });
    setValue('cloudinary_url', result.secure_url, { shouldValidate: true });
  };

  const handlePhotoClear = () => {
    setUploadedMedia(null);
    setValue('cloudinary_public_id', '', { shouldValidate: true });
    setValue('cloudinary_url', '', { shouldValidate: true });
  };

  const onSubmit = async (data: ReportIncidentFormData) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (uploadedMedia) {
        data.cloudinary_public_id = uploadedMedia.public_id;
        data.cloudinary_url = uploadedMedia.secure_url;
      }

      // Persist live incident to database
      const res = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Incident submission failed.');
      }
      setSuccessCode(json.incident?.reference_code ?? generateReferenceCode());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportAnother = () => {
    setSuccessCode(null);
    setUploadedMedia(null);
    setSubmitError(null);
    reset();
  };

  // ── Success screen ──────────────────────────────────────────
  if (successCode) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl">
          <div className="h-16 w-16 bg-emerald-950/60 border border-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Crisis Incident Reported</h2>
          <p className="text-slate-300 text-sm mb-6">
            Your incident report has been securely registered in the system. It is marked as{' '}
            <strong className="text-yellow-400">UNVERIFIED</strong> pending validation by relief coordinators.
          </p>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-5 py-4 mb-6 inline-block w-full">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
              Official Reference ID
            </p>
            <p className="text-2xl font-mono font-bold text-orange-400">{successCode}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" onClick={handleReportAnother} className="flex-1">
              Report Another Incident
            </Button>
            <Button variant="outline" onClick={() => router.push('/map')} className="flex-1">
              Explore on Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Report a Crisis Incident</h1>
        <p className="text-slate-400 text-sm mt-1.5">
          Submit immediate field hazards, requests for rescue, food, water, or medical evacuation.
        </p>
      </div>

      {/* Emergency Alert */}
      <div className="mb-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl flex items-start gap-3 text-xs text-red-200">
        <Shield className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-semibold">IMMEDIATE THREAT TO HUMAN LIFE?</strong> Do not rely exclusively
          on this prototype application. Dial <strong>112 (National Emergency)</strong> or local rescue forces immediately.
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-700 rounded-xl flex gap-3 text-sm text-red-300">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div>{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <Input
          label="Incident Title"
          id="title"
          required
          placeholder="e.g. Flooded residential colony — 50 families stranded"
          error={errors.title?.message}
          {...register('title')}
          disabled={submitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <Select
            label="Hazard Category"
            id="category"
            required
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register('category')}
            disabled={submitting}
          />

          {/* Severity */}
          <Select
            label="Severity Rating"
            id="severity"
            required
            options={SEVERITY_OPTIONS}
            error={errors.severity?.message}
            {...register('severity')}
            disabled={submitting}
          />
        </div>

        {/* Reporter Contact Information (Mandatory for Field Verification) */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-orange-400" />
              Reporter Identification & Contact (Mandatory)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Coordinators will call this phone number to verify the crisis before dispatching emergency responders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Full Name"
              id="reporter_name"
              required
              placeholder="e.g. Ramesh Kumar"
              error={errors.reporter_name?.message}
              {...register('reporter_name')}
              disabled={submitting}
            />

            <Input
              label="Contact Mobile / Phone Number"
              id="reporter_phone"
              type="tel"
              required
              placeholder="e.g. 9876543210"
              error={errors.reporter_phone?.message}
              {...register('reporter_phone')}
              disabled={submitting}
            />
          </div>
        </div>

        {/* User-friendly Location Input (Auto-geocoded in background, no manual lat/lon) */}
        <LocationSearchInput
          label="Location, Address, Area, or Landmark"
          id="location_name"
          required
          placeholder="e.g. Velachery, Chennai, Government Hospital Tambaram, or 600042"
          error={errors.location_name?.message}
          disabled={submitting}
          onLocationSelect={(loc) => {
            setValue('location_name', loc.location_name, { shouldValidate: true });
            setValue('latitude', loc.latitude);
            setValue('longitude', loc.longitude);
          }}
        />

        {/* People Affected */}
        <Input
          label="Estimated Number of Affected Persons (Optional)"
          id="people_affected"
          type="number"
          min={0}
          placeholder="e.g. 150"
          error={errors.people_affected?.message}
          {...register('people_affected', { valueAsNumber: true })}
          disabled={submitting}
        />

        {/* Description */}
        <Textarea
          label="Detailed Situation Description"
          id="description"
          required
          rows={4}
          placeholder="Provide specific details regarding water levels, structural collapses, injuries, access road blockages, etc."
          error={errors.description?.message}
          {...register('description')}
          disabled={submitting}
        />

        {/* Assistance Requested */}
        <Textarea
          label="Specific Assistance or Supplies Needed (Optional)"
          id="assistance_requested"
          rows={3}
          placeholder="e.g. Inflatable rescue boats, clean drinking water cans, baby formula, insulin"
          error={errors.assistance_requested?.message}
          {...register('assistance_requested')}
          disabled={submitting}
        />

        {/* Mandatory Photographic Evidence */}
        <div className="pt-2">
          <PhotoUpload
            onUploadComplete={handlePhotoUploadComplete}
            onClear={handlePhotoClear}
            error={errors.cloudinary_url?.message}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full text-base font-semibold py-3 shadow-lg shadow-orange-950/50"
          >
            Submit Incident Report
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3">
            Reports will be recorded with status UNVERIFIED and immediately broadcast to the relief coordinator dashboard.
          </p>
        </div>
      </form>
    </div>
  );
}
