import { Mail, MessageCircle, Plus, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Notice } from '@/components/ui/feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-context';
import { cn } from '@/lib/cn';
import { mailtoHref, telHref, whatsappHref } from '@/pages/team/contact-uris';
import {
  initialsOf,
  TEAM_ARCHIVE_STATS,
  TEAM_DEPARTMENTS,
  TEAM_DEPARTMENT_OPTIONS,
  TEAM_MEMBERS,
  type TeamDepartment,
  type TeamMember,
} from '@/pages/team/team-data';

const STAT_TILES = [
  {
    labelKey: 'team.statMembers',
    tone: 'from-emerald-600/20 to-emerald-900/10 border-emerald-800/40',
  },
  {
    labelKey: 'team.statDepartments',
    tone: 'from-blue-600/20 to-blue-900/10 border-blue-800/40',
  },
  {
    labelKey: 'team.statOnsite',
    tone: 'from-cyan-600/20 to-cyan-900/10 border-cyan-800/40',
  },
  {
    labelKey: 'team.statAvailable',
    tone: 'from-purple-600/20 to-purple-900/10 border-purple-800/40',
  },
] as const;

interface FormState {
  name: string;
  role: string;
  department: TeamDepartment;
  email: string;
  phone: string;
  bio: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  role: '',
  department: 'Technique',
  email: '',
  phone: '',
  bio: '',
};

export function TeamPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [members, setMembers] = useState<TeamMember[]>(() => [...TEAM_MEMBERS]);
  const [department, setDepartment] = useState<'all' | TeamDepartment>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      members: members.length,
      departments: new Set(members.map((member) => member.department)).size,
      onsite: TEAM_ARCHIVE_STATS.onsite,
      available: TEAM_ARCHIVE_STATS.available,
    }),
    [members],
  );

  const visible = members.filter(
    (member) => department === 'all' || member.department === department,
  );
  const detail = members.find((member) => member.id === detailId) ?? null;
  const detailEmailHref = detail ? mailtoHref(detail.email) : null;
  const detailPhoneHref = detail?.phone ? telHref(detail.phone) : null;

  const setField = <Key extends keyof FormState>(key: Key, value: FormState[Key]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addMember = (): void => {
    setError(null);
    if (form.name.trim() === '' || form.role.trim() === '') {
      setError(t('team.required'));
      return;
    }
    const member: TeamMember = {
      id: `session-${members.length + 1}-${initialsOf(form.name).toLowerCase()}`,
      initials: initialsOf(form.name),
      name: form.name.trim(),
      role: form.role.trim(),
      department: form.department,
      bio: form.bio.trim(),
      email: form.email.trim(),
      whatsapp: null,
      phone: form.phone.trim() || undefined,
      avatarClass: 'from-slate-600 to-slate-700',
    };
    setMembers((current) => [...current, member]);
    setForm(EMPTY_FORM);
    setAddOpen(false);
    toast.push(t('team.added'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Ovitech"
            width={48}
            height={48}
            className="size-12 rounded-full object-cover ring-2 ring-accent/40 shadow-lg"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-fg-strong">Équipe de travail</h1>
            <p className="mt-0.5 text-sm text-fg-muted">
              Experts Ovitech — Ferme ovine Sidi Bel Abbès
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-strong px-4 text-sm font-semibold text-accent-contrast shadow-accent hover:bg-accent"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          {t('team.addMember')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STAT_TILES.map((tile) => {
          const value =
            tile.labelKey === 'team.statMembers'
              ? stats.members
              : tile.labelKey === 'team.statDepartments'
                ? stats.departments
                : tile.labelKey === 'team.statOnsite'
                  ? stats.onsite
                  : stats.available;
          return (
            <div
              key={tile.labelKey}
              className={cn('rounded-2xl border bg-gradient-to-br p-4', tile.tone)}
            >
              <p className="text-xs font-medium text-fg-muted">{t(tile.labelKey)}</p>
              <p className="mt-2 text-2xl font-bold text-fg-strong">{value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setDepartment('all')}
          aria-pressed={department === 'all'}
          className={cn(
            'shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium',
            department === 'all'
              ? 'border-accent/40 bg-accent/20 text-accent'
              : 'border-transparent text-fg-muted hover:bg-surface-3 hover:text-fg-strong',
          )}
        >
          {t('team.all')}
        </button>
        {TEAM_DEPARTMENTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setDepartment(value)}
            aria-pressed={department === value}
            className={cn(
              'shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium',
              department === value
                ? 'border-accent/40 bg-accent/20 text-accent'
                : 'border-transparent text-fg-muted hover:bg-surface-3 hover:text-fg-strong',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((member) => (
          <div
            key={member.id}
            className="flex flex-col rounded-2xl border border-border bg-surface-2 p-5 hover:border-accent/40 hover:bg-surface-3"
          >
            <button
              type="button"
              onClick={() => setDetailId(member.id)}
              className="flex-1 text-start"
            >
              <div className="mb-3 flex items-start gap-4">
                <div
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg',
                    member.avatarClass,
                  )}
                >
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-fg-strong">{member.name}</h2>
                  <p className="text-xs font-medium text-accent">{member.role}</p>
                  <span className="mt-1 inline-block rounded-full border border-border bg-surface-3/60 px-2 py-0.5 text-xs text-fg-muted">
                    {member.department}
                  </span>
                </div>
              </div>
              <p className="mb-3 line-clamp-2 text-xs text-fg-muted">{member.bio}</p>
              <div className="mb-3 flex items-center gap-3 text-xs text-fg-subtle">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mail className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{member.email}</span>
                </span>
              </div>
            </button>
            {member.whatsapp ? (
              <a
                href={whatsappHref(member.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-[#20bd5a]"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t('team.contactWhatsApp')}
              </a>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-fg-subtle hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
        >
          <Plus className="size-7" aria-hidden="true" />
          <span className="text-sm font-medium">{t('team.addMember')}</span>
        </button>
      </div>

      <p className="text-xs text-fg-subtle">{t('team.demoNote')}</p>

      <Dialog
        open={detail !== null}
        onClose={() => setDetailId(null)}
        title={t('team.detailTitle')}
        closeLabel={t('common.close')}
        size="md"
        animated={false}
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex size-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-bold text-white shadow-lg',
                  detail.avatarClass,
                )}
              >
                {detail.initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-fg-strong">{detail.name}</h2>
                <p className="text-sm font-medium text-accent">{detail.role}</p>
                <span className="mt-1.5 inline-block rounded-full border border-border bg-surface-3/60 px-2 py-0.5 text-xs text-fg-muted">
                  {detail.department}
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-fg-muted">{detail.bio}</p>

            <div className="space-y-2">
              {detailEmailHref ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-3/50 px-3 py-2.5">
                  <span className="text-xs text-fg-muted">{t('team.email')}</span>
                  <a
                    href={detailEmailHref}
                    className="truncate text-xs font-semibold text-fg hover:text-accent"
                  >
                    {detail.email}
                  </a>
                </div>
              ) : null}
              {detailPhoneHref ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-3/50 px-3 py-2.5">
                  <span className="text-xs text-fg-muted">{t('team.phone')}</span>
                  <a
                    href={detailPhoneHref}
                    className="truncate text-xs font-semibold text-fg hover:text-accent"
                    dir="ltr"
                  >
                    {detail.phone}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {detail.whatsapp ? (
                <a
                  href={whatsappHref(detail.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white hover:bg-[#20bd5a]"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t('team.contactWhatsApp')}
                </a>
              ) : null}
              {detailEmailHref ? (
                <a
                  href={detailEmailHref}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-3 px-3 text-sm font-semibold text-fg hover:border-border-strong"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {t('team.email')}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setError(null);
        }}
        title={t('team.addTitle')}
        closeLabel={t('common.close')}
        size="md"
        animated={false}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAddOpen(false);
                setError(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={addMember}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={t('team.name')} htmlFor="team-name" required>
            <Input
              id="team-name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t('team.role')} htmlFor="team-role" required>
            <Input
              id="team-role"
              value={form.role}
              onChange={(event) => setField('role', event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label={t('team.department')} htmlFor="team-department">
            <Select
              id="team-department"
              value={form.department}
              onChange={(event) => setField('department', event.target.value as TeamDepartment)}
            >
              {TEAM_DEPARTMENT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('team.email')} htmlFor="team-email">
              <Input
                id="team-email"
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                maxLength={160}
                dir="ltr"
              />
            </Field>
            <Field label={t('team.phone')} htmlFor="team-phone">
              <Input
                id="team-phone"
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                maxLength={40}
                dir="ltr"
              />
            </Field>
          </div>
          <Field label={t('team.bio')} htmlFor="team-bio">
            <Textarea
              id="team-bio"
              value={form.bio}
              onChange={(event) => setField('bio', event.target.value)}
              maxLength={1000}
            />
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>
      </Dialog>
    </div>
  );
}
