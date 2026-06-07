import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Card } from '../components/common/FormElements.js';

const highlights = [
  {
    title: 'Reception-led registration',
    description: 'Patients are added by reception staff and issued tracking details from the lab desk.',
  },
  {
    title: 'Fast lab workflow',
    description: 'Samples move from reception to lab, doctor review, and result release with clear handoffs.',
  },
  {
    title: 'Secure access',
    description: 'Patients and staff use the same portal, with role-based access controls for each workflow.',
  },
];

const workflow = [
  'Patient onboarding at reception',
  'Sample collection and testing',
  'Doctor review and approval',
  'Result delivery and tracking',
];

export const HomePage: React.FC = () => {
  const { token } = useAuthStore();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.20),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.18),_transparent_28%),linear-gradient(180deg,_#090f1f_0%,_#0f172a_50%,_#111827_100%)]" />
      <div className="absolute left-[-5rem] top-24 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl animate-glow" />
      <div className="absolute right-[-6rem] bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-glow" />

      <div className="relative z-10">
        <section className="container py-8 sm:py-10">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/20">
                <span className="text-lg">🧪</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Macheke Medical Lab</p>
                <p className="text-xs text-slate-300">Laboratory Management System</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/login"
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              >
                Login
              </Link>
              <a
                href="#workflow"
                className="rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-sm text-sky-100 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-400/20"
              >
                Explore Workflow
              </a>
            </div>
          </div>
        </section>

        <section className="container pb-8 pt-6 sm:pb-14 sm:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-fade-up">
              <p className="section-chip mb-5 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Trusted clinical workflow
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl xl:text-7xl">
                Macheke Medical Laboratory
                <span className="block bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Manage patient onboarding, laboratory processing, approvals, and result delivery in one polished workflow built for reception and clinical teams.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={token ? '/dashboard' : '/login'}
                  className="inline-flex min-w-44 items-center justify-center rounded-full border border-sky-300/25 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(59,130,246,0.38)]"
                >
                  {token ? 'Go to Dashboard' : 'Login'}
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  View Services
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Reception onboarding', 'Role-based access', 'Result tracking', 'Doctor approvals'].map((item) => (
                  <span key={item} className="section-chip text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Card className="animate-fade-up border-white/10 bg-slate-900/75 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-sky-300/80">System snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Modern lab operations</h2>
                </div>
                <div className="section-chip">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>

              <div className="grid gap-4">
                {highlights.map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/10"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="workflow" className="container pb-8 sm:pb-14">
          <div className="grid gap-6 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <Card
                key={step}
                className="animate-fade-up border-white/10 bg-slate-900/70 transition duration-300 hover:-translate-y-1 hover:border-sky-400/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">Step {index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step}</h3>
              </Card>
            ))}
          </div>
        </section>

        <section id="services" className="container pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-white/10 bg-slate-900/70">
              <h3 className="text-xl font-semibold text-white">For Reception</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Register patients, capture samples, and hand over tracking details with a streamlined front-desk workflow.
              </p>
            </Card>
            <Card className="border-white/10 bg-slate-900/70">
              <h3 className="text-xl font-semibold text-white">For Lab Teams</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Process samples, record results, and trigger doctor approvals with fewer manual steps.
              </p>
            </Card>
            <Card className="border-white/10 bg-slate-900/70">
              <h3 className="text-xl font-semibold text-white">For Patients</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Track results, view updates, and access invoices through the same secure portal after onboarding.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};
