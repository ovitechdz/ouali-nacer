import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Notice } from '@/components/ui/feedback';
import { STAGES, type NewAnimalInput, type Sex, type Stage } from '@/domain';

export interface AnimalFormProps {
  pens: readonly string[];
  defaults?: Partial<NewAnimalInput>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: NewAnimalInput) => Promise<boolean>;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export function AnimalForm({ pens, defaults, submitLabel, busy, onSubmit }: AnimalFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(defaults?.code ?? '');
  const [rfid, setRfid] = useState(defaults?.rfid ?? '');
  const [sex, setSex] = useState<Sex>(defaults?.sex ?? 'F');
  const [breed, setBreed] = useState(defaults?.breed ?? '');
  const [birthDate, setBirthDate] = useState(defaults?.birthDate ?? today());
  const [stage, setStage] = useState<Stage>(defaults?.stage ?? 'agneau');
  const [pen, setPen] = useState(defaults?.pen ?? pens[0] ?? 'A1');
  const [weight, setWeight] = useState(String(defaults?.weight ?? ''));
  const [bcs, setBcs] = useState(String(defaults?.bcs ?? ''));
  const [notes, setNotes] = useState(defaults?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (code.trim() === '' || rfid.trim() === '' || pen.trim() === '' || breed.trim() === '') {
      setError(t('herd.required'));
      return;
    }
    const ok = await onSubmit({
      code: code.trim(),
      rfid: rfid.trim(),
      sex,
      breed: breed.trim(),
      birthDate,
      stage,
      pen: pen.trim(),
      weight: weight.trim() === '' ? '' : Number(weight),
      bcs: bcs.trim() === '' ? '' : Number(bcs),
      notes: notes.trim() || undefined,
    });
    if (!ok) setError(t('domain.error.invalid'));
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('herd.code')} htmlFor="animal-code" required>
          <Input
            id="animal-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={32}
            autoComplete="off"
          />
        </Field>
        <Field label={t('herd.rfid')} htmlFor="animal-rfid" required>
          <Input
            id="animal-rfid"
            value={rfid}
            onChange={(event) => setRfid(event.target.value)}
            maxLength={64}
            dir="ltr"
            autoComplete="off"
          />
        </Field>
        <Field label={t('herd.sex')} htmlFor="animal-sex">
          <Select
            id="animal-sex"
            value={sex}
            onChange={(event) => setSex(event.target.value === 'M' ? 'M' : 'F')}
          >
            <option value="F">{t('herd.sexFemale')}</option>
            <option value="M">{t('herd.sexMale')}</option>
          </Select>
        </Field>
        <Field label={t('herd.breed')} htmlFor="animal-breed" required>
          <Input
            id="animal-breed"
            value={breed}
            onChange={(event) => setBreed(event.target.value)}
            maxLength={80}
          />
        </Field>
        <Field label={t('herd.birthDate')} htmlFor="animal-birth">
          <Input
            id="animal-birth"
            type="date"
            value={birthDate}
            max={today()}
            onChange={(event) => setBirthDate(event.target.value)}
          />
        </Field>
        <Field label={t('herd.stage')} htmlFor="animal-stage">
          <Select
            id="animal-stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as Stage)}
          >
            {STAGES.map((value) => (
              <option key={value} value={value}>
                {t(`domain.stage.${value}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('herd.pen')} htmlFor="animal-pen" required>
          {pens.length > 0 ? (
            <Select id="animal-pen" value={pen} onChange={(event) => setPen(event.target.value)}>
              {pens.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          ) : (
            <Input id="animal-pen" value={pen} onChange={(event) => setPen(event.target.value)} />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('herd.initialWeight')}
            htmlFor="animal-weight"
            hint={t('common.optional')}
          >
            <Input
              id="animal-weight"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </Field>
          <Field label={t('herd.initialBcs')} htmlFor="animal-bcs" hint="1–5">
            <Input
              id="animal-bcs"
              inputMode="decimal"
              value={bcs}
              onChange={(event) => setBcs(event.target.value)}
            />
          </Field>
        </div>
      </div>
      <Field label={t('herd.notes')} htmlFor="animal-notes" hint={t('common.optional')}>
        <Textarea
          id="animal-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
        />
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button type="submit" disabled={busy}>
        {busy ? t('common.saving') : submitLabel}
      </Button>
    </form>
  );
}
