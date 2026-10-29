import { useId, useState } from 'react';
import type { EventKind } from '@shared/plan';
import { packFor, packList, defaultValues } from '@shared/packs';
import { describePlan } from '@/lib/api';
import { shiftDays } from '@shared/engine';
import { redact } from '@shared/redact';
import { todayIso } from '@/lib/format';
import { useNavigate } from '@/lib/router';
import { useWorkspace } from '@/state/useWorkspace';
import { newId, newPlan } from '@/state/workspace';
import { Button, Card, Field } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import styles from './pages.module.css';

const DEFAULT_ANCHOR: Readonly<Record<EventKind, string>> = {
  wedding: '09:30',
  birthday: '17:00',
  community: '10:00',
};

export function NewPlanPage(): React.JSX.Element {
  const ids = useId();
  const navigate = useNavigate();
  const { dispatch } = useWorkspace();

  const [kind, setKind] = useState<EventKind>('wedding');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [dateIso, setDateIso] = useState(() => shiftDays(todayIso(), 120));
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [notes, setNotes] = useState<readonly string[]>([]);
  const [values, setValues] = useState(() => defaultValues(packFor('wedding')));

  function changeKind(next: EventKind): void {
    setKind(next);
    setValues(defaultValues(packFor(next)));
  }

  async function setItUp(): Promise<void> {
    const text = redact(description).trim();
    if (text === '') {
      setProblem('Say a little about the event first.');
      return;
    }

    setBusy(true);
    setProblem(null);
    const result = await describePlan({
      text,
      kind,
      variableIds: packFor(kind).variables.map((variable) => variable.id),
    });
    setBusy(false);

    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    if (result.value.name !== '' && name === '') setName(result.value.name);
    if (result.value.place !== '') setPlace(result.value.place);
    setValues((previous) => ({ ...previous, ...result.value.values }));
    setNotes(result.value.notes);
  }

  function create(): void {
    const trimmed = name.trim();
    if (trimmed === '') {
      setProblem('Give the plan a name so you can find it again.');
      return;
    }

    const id = newId('p');
    const scenarioId = `${id}-a`;
    const plan = newPlan({
      id,
      scenarioId,
      name: trimmed.slice(0, 60),
      kind,
      place: place.trim().slice(0, 60),
      eventDateIso: dateIso,
      anchorTime: DEFAULT_ANCHOR[kind],
    });
    const first = plan.scenarios[0];

    dispatch({
      type: 'createPlan',
      plan:
        first === undefined
          ? plan
          : { ...plan, scenarios: [{ ...first, values, baseline: values }] },
    });
    navigate({ name: 'plan', planId: id, view: 'budget' });
  }

  return (
    <div>
      <h1 className={styles.heroTitle}>Start a plan</h1>
      <p className={styles.heroText}>
        Rough numbers are fine. Everything is a lever you can move afterwards, and nothing is
        committed until you say so.
      </p>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          create();
        }}
      >
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className={controlStyles.fieldLabel}>What are you planning?</legend>
          <div className={styles.kindRow}>
            {packList.map((pack) => (
              <label key={pack.kind} className={styles.kindOption} htmlFor={`${ids}-${pack.kind}`}>
                <input
                  id={`${ids}-${pack.kind}`}
                  type="radio"
                  name={`${ids}-kind`}
                  value={pack.kind}
                  checked={kind === pack.kind}
                  onChange={() => {
                    changeKind(pack.kind);
                  }}
                />
                <span className={styles.kindName}>{pack.label}</span>
                <span className={styles.kindBlurb}>{pack.blurb}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Name it" htmlFor={`${ids}-name`}>
          <input
            id={`${ids}-name`}
            className={controlStyles.input}
            type="text"
            maxLength={60}
            placeholder="Priya and Arjun"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setProblem(null);
            }}
          />
        </Field>

        <div className={styles.pair}>
          <Field label="Where" htmlFor={`${ids}-place`}>
            <input
              id={`${ids}-place`}
              className={controlStyles.input}
              type="text"
              maxLength={60}
              placeholder="Hyderabad"
              value={place}
              onChange={(event) => {
                setPlace(event.target.value);
              }}
            />
          </Field>

          <Field label="When" htmlFor={`${ids}-date`}>
            <input
              id={`${ids}-date`}
              className={controlStyles.input}
              type="date"
              value={dateIso}
              onChange={(event) => {
                if (event.target.value !== '') setDateIso(event.target.value);
              }}
            />
          </Field>
        </div>

        <Card title="Or just describe it">
          <Field
            label="In your own words"
            htmlFor={`${ids}-description`}
            help="The assistant only sets the levers. Every number is still worked out here, by code."
          >
            <textarea
              id={`${ids}-description`}
              className={controlStyles.textarea}
              maxLength={4000}
              placeholder="A Telugu wedding in Hyderabad in March, around 350 guests, three functions, mum wants a hotel"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setProblem(null);
              }}
            />
          </Field>
          <div className={styles.heroActions}>
            <Button
              disabled={busy}
              onClick={() => {
                void setItUp();
              }}
            >
              {busy ? 'Reading…' : 'Set it up for me'}
            </Button>
            <span className={styles.hint}>Phone numbers and links are removed before sending.</span>
          </div>
          {notes.length === 0 ? null : (
            <ul>
              {notes.map((note) => (
                <li key={note} className={styles.hint}>
                  {note}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {problem === null ? null : <p className={styles.error}>{problem}</p>}

        <div className={styles.heroActions}>
          <Button type="submit" variant="primary">
            Create the plan
          </Button>
        </div>
      </form>
    </div>
  );
}
