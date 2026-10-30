import { useId, useMemo, useState } from 'react';
import type { EventKind } from '@shared/plan';
import { packFor, packList, defaultValues } from '@shared/packs';
import { applyDescribedSettings, describeLevers } from '@shared/describeSettings';
import { describePlan } from '@/lib/api';
import { buildModel, shiftDays } from '@shared/engine';
import { redact } from '@shared/redact';
import { moneyShort, plural, todayIso } from '@/lib/format';
import { useNavigate } from '@/lib/router';
import { useWorkspace } from '@/state/useWorkspace';
import { newId, newPlan } from '@/state/workspace';
import { Button } from '@/ui/controls';
import { DateField } from '@/ui/DateField';
import { controlStyles } from '@/ui/controlStyles';
import { IconSpark } from '@/ui/icons';
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

  // The point of the product, before anything is committed to: what this
  // shape of event costs as it stands.
  const preview = useMemo(
    () =>
      buildModel(packFor(kind), {
        values,
        eventDateIso: dateIso,
        anchorTime: DEFAULT_ANCHOR[kind],
        commitments: [],
      }),
    [kind, values, dateIso],
  );

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
      levers: describeLevers(packFor(kind)),
    });
    setBusy(false);

    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    if (result.value.name !== '' && name === '') setName(result.value.name);
    if (result.value.place !== '') setPlace(result.value.place);
    setValues((previous) => ({
      ...previous,
      ...applyDescribedSettings(packFor(kind), result.value.settings),
    }));
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
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        create();
      }}
    >
      <div className={styles.head}>
        <h1 className={styles.title}>Start a plan</h1>
        <p className={styles.intro}>
          Rough numbers are fine. Everything here is a lever you can move afterwards, and nothing is
          committed until you say so.
        </p>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>What are you planning?</legend>
        <div className={styles.kindRow}>
          {packList.map((pack) => (
            <label key={pack.kind} className={styles.kind} htmlFor={`${ids}-${pack.kind}`}>
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
              <span className={styles.kindMark} aria-hidden="true" />
              <span className={styles.kindName}>{pack.label}</span>
              <span className={styles.kindBlurb}>{pack.blurb}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.split}>
        <div className={styles.facts}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${ids}-name`}>
              Name it
            </label>
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
          </div>

          <div className={styles.pair}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${ids}-place`}>
                Where
              </label>
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
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${ids}-date`}>
                When
              </label>
              <DateField
                id={`${ids}-date`}
                label="Choose the date of the event"
                value={dateIso}
                min={todayIso()}
                onChange={setDateIso}
              />
            </div>
          </div>

          <div className={styles.preview}>
            <span className={styles.previewLabel}>Starting point</span>
            <span className={styles.previewFigure}>{moneyShort(preview.totals.all)}</span>
            <span className={styles.previewNote}>
              {plural(preview.lines.length, 'line')} ·{' '}
              {plural(preview.deadlines.length, 'decision')} ·{' '}
              {plural(preview.tasks.length, 'task')}
            </span>
          </div>

          {problem === null ? null : (
            <p className={styles.error} role="alert">
              {problem}
            </p>
          )}

          <Button type="submit" variant="primary" large>
            Create the plan
          </Button>
        </div>

        <section className={styles.describe}>
          <h2 className={styles.describeTitle}>
            <IconSpark size={17} />
            Or just describe it
          </h2>
          <label className={styles.label} htmlFor={`${ids}-description`}>
            In your own words
          </label>
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
          <div className={styles.describeFoot}>
            <Button
              disabled={busy}
              onClick={() => {
                void setItUp();
              }}
            >
              {busy ? 'Reading…' : 'Set it up for me'}
            </Button>
            <span className={styles.hint}>
              The assistant only sets the levers; every number is worked out here, by code. Phone
              numbers and links are removed before sending.
            </span>
          </div>
          {notes.length === 0 ? null : (
            <ul className={styles.notes}>
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </form>
  );
}
