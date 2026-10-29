import { useId, useState } from 'react';
import type { CostLine } from '@shared/engine';
import type { Commitment } from '@shared/plan';
import { hasPersonalDetail, redact } from '@shared/redact';
import { readQuote } from '@/lib/api';
import { Button, Field } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import styles from './vendors.module.css';

/**
 * Records what a vendor actually promised. The planner can type it, or paste
 * the message and let the assistant read it; either way the amount is checked
 * and the source wording is kept as evidence.
 */
export function QuoteForm({
  line,
  onSave,
  onCancel,
}: {
  line: CostLine;
  onSave: (commitment: Omit<Commitment, 'id'>) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const ids = useId();
  const [vendor, setVendor] = useState(line.vendor ?? '');
  const [amount, setAmount] = useState(String(line.amount));
  const [text, setText] = useState(line.quote ?? '');
  const [paid, setPaid] = useState(line.state === 'paid');
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const amountIsValid =
    amount.trim() !== '' && Number.isFinite(numericAmount) && numericAmount >= 0;

  async function readItForMe(): Promise<void> {
    const cleaned = redact(text).trim();
    if (cleaned === '') {
      setProblem('Paste the vendor’s message first.');
      return;
    }

    setReading(true);
    setProblem(null);
    const result = await readQuote({ text: cleaned, lineLabel: line.label });
    setReading(false);

    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    if (result.value.vendor !== '') setVendor(result.value.vendor);
    setAmount(String(result.value.amount));
    setInclusions([...result.value.inclusions]);
    setExclusions([...result.value.exclusions]);
    if (result.value.evidence !== '') setText(result.value.evidence);
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (vendor.trim() === '') {
          setProblem('Who gave you this price?');
          return;
        }
        if (!amountIsValid) {
          setProblem('Enter the amount as a number.');
          return;
        }
        onSave({
          ruleId: line.ruleId,
          vendor: vendor.trim().slice(0, 80),
          amount: Math.round(numericAmount),
          state: paid ? 'paid' : 'quoted',
          quote: redact(text).trim().slice(0, 400),
          inclusions,
          exclusions,
        });
      }}
    >
      <Field label="What they sent you" htmlFor={`${ids}-text`}>
        <textarea
          id={`${ids}-text`}
          className={controlStyles.textarea}
          maxLength={4000}
          placeholder="Paste the WhatsApp message or type what they said"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setProblem(null);
          }}
        />
      </Field>

      <div className={styles.actions}>
        <Button
          onClick={() => {
            void readItForMe();
          }}
          disabled={reading}
        >
          {reading ? 'Reading…' : 'Read it for me'}
        </Button>
        <span className={styles.privacy}>
          {hasPersonalDetail(text)
            ? 'Phone numbers and addresses are removed before anything is sent.'
            : 'Only this extract is sent, never your plan.'}
        </span>
      </div>

      <div className={styles.pair}>
        <Field label="Vendor" htmlFor={`${ids}-vendor`}>
          <input
            id={`${ids}-vendor`}
            className={controlStyles.input}
            type="text"
            maxLength={80}
            value={vendor}
            onChange={(event) => {
              setVendor(event.target.value);
              setProblem(null);
            }}
          />
        </Field>

        <Field label="Amount" htmlFor={`${ids}-amount`}>
          <input
            id={`${ids}-amount`}
            className={controlStyles.input}
            type="number"
            min={0}
            step={1}
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setProblem(null);
            }}
          />
        </Field>
      </div>

      {inclusions.length + exclusions.length === 0 ? null : (
        <p className={styles.detail}>
          {inclusions.length > 0 ? `Includes: ${inclusions.join(', ')}. ` : ''}
          {exclusions.length > 0 ? `Excludes: ${exclusions.join(', ')}.` : ''}
        </p>
      )}

      <Field label="" htmlFor={`${ids}-paid`}>
        <label className={styles.status} htmlFor={`${ids}-paid`}>
          <input
            id={`${ids}-paid`}
            type="checkbox"
            checked={paid}
            onChange={(event) => {
              setPaid(event.target.checked);
            }}
          />{' '}
          An advance has been paid, so this decision is no longer free to change
        </label>
      </Field>

      {problem === null ? null : <p className={styles.error}>{problem}</p>}

      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
