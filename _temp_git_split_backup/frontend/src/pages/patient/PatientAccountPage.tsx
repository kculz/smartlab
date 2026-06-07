import React, { useEffect, useState } from 'react';
import { authService } from '../../services/index.js';
import { Button, Card, Input } from '../../components/common/FormElements.js';
import { useRequireAuth } from '../../hooks/useAuth.js';
import type { Patient, User } from '../../types/index.js';

type PatientProfile = User & {
  phone?: string | null;
  is_active?: boolean;
  patient?: Patient | null;
};

export const PatientAccountPage: React.FC = () => {
  useRequireAuth(['patient']);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await authService.getProfile();
        setProfile(response.data as PatientProfile);
      } catch (loadError) {
        console.error('Failed to load patient profile:', loadError);
        setError('Could not load your account details right now.');
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    setSuccess('');
    setError('');

    try {
      await authService.changePassword(passwordForm);
      setSuccess('Your password was updated successfully.');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (submitError) {
      console.error('Change password failed:', submitError);
      setError('Could not change your password. Please check the current password and try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-slate-900/75">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">Patient account</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Manage your login</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Keep your portal password up to date and review the account details reception issued for your profile.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-slate-900/75">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Profile</h3>
            <span className="text-xs text-slate-400">{loadingProfile ? 'Loading...' : 'Current account'}</span>
          </div>

          {profile ? (
            <div className="space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Full name</p>
                <p className="mt-1 text-base font-medium text-white">{profile.full_name}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-1 text-white">{profile.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
                  <p className="mt-1 text-white">{profile.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-1 text-white">{profile.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              {profile.patient && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Patient record</p>
                  <p className="mt-1 text-white">
                    {profile.patient.first_name} {profile.patient.last_name}
                  </p>
                  <p className="text-sm text-slate-300">{profile.patient.email}</p>
                  <p className="text-sm text-slate-300">{profile.patient.phone}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {loadingProfile ? 'Loading your account details...' : 'No profile details loaded yet.'}
            </p>
          )}
        </Card>

        <Card className="border-white/10 bg-slate-900/75">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">Change password</h3>
            <p className="mt-1 text-sm text-slate-300">
              Use your current password, then choose a new one for your next login.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Current password"
              type="password"
              value={passwordForm.current_password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
              }
              placeholder="Current password"
              required
            />
            <Input
              label="New password"
              type="password"
              value={passwordForm.new_password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
              }
              placeholder="New password"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))
              }
              placeholder="Confirm new password"
              required
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                loading={savingPassword}
                loadingText="Updating..."
                className="rounded-full px-6 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
              >
                Update Password
              </Button>
              {success && <p className="text-sm text-emerald-300">{success}</p>}
            </div>

            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          </form>
        </Card>
      </div>
    </section>
  );
};
