import { useState } from 'react';
import type { Idea } from '@shared/api';
import type { Plan } from '@shared/plan';
import { suggestIdeas } from '@/lib/api';
import { money, plural } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { Button, Card, Chip, EmptyState } from '@/ui/controls';
import styles from './ideas.module.css';

/**
 * A one-paragraph description of the plan, built from the model rather than
 * from anything the planner typed, so nothing personal is sent. The kind of
 * event and the shape of its spending, and nothing else: not the name, not
 * the place, and not the date — the screen promises as much, so it has to be
 * true. Lead times come back from the model and are compared against the real
 * date here.
 */
function summarise(plan: Plan, lines: readonly { label: string; amount: number }[]): string {
  const biggest = [...lines]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((line) => `${line.label} ${String(Math.round(line.amount))}`)
    .join(', ');
  return `A ${plan.kind}. Largest lines: ${biggest}.`;
}

export function IdeasView({ plan }: { plan: Plan }): React.JSX.Element {
  const { current } = usePlanModel(plan);
  const [ideas, setIdeas] = useState<readonly Idea[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const headroom = current.totals.movable;

  async function ask(): Promise<void> {
    setBusy(true);
    setProblem(null);
    const result = await suggestIdeas({
      kind: plan.kind,
      summary: summarise(plan, current.lines),
      headroom,
    });
    setBusy(false);
    if (result.ok) setIdeas(result.value.ideas);
    else setProblem(result.message);
  }

  return (
    <Card title="Ideas you can actually afford">
      <p className={styles.intro}>
        Suggestions are asked for against what this plan can still absorb — {money(headroom)} is
        still only an estimate — and each one comes back with what it would cost and how far ahead
        it has to be booked. Anything that does not fit is not offered.
      </p>

      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => {
            void ask();
          }}
        >
          {busy ? 'Thinking…' : ideas === null ? 'Suggest ideas' : 'Suggest again'}
        </Button>
        <span className={styles.intro}>No names, dates or messages are sent. Only the shape.</span>
      </div>

      {problem === null ? null : <p className={styles.error}>{problem}</p>}

      {ideas === null ? (
        <EmptyState title="Nothing suggested yet.">
          <p>Ask when the shape of the plan has settled a little.</p>
        </EmptyState>
      ) : ideas.length === 0 ? (
        <EmptyState title="Nothing fits inside what is left." />
      ) : (
        <div className={styles.list}>
          {ideas.map((idea) => (
            <article key={idea.title} className={styles.idea}>
              <div className={styles.ideaHead}>
                <span className={styles.ideaTitle}>{idea.title}</span>
                <span className={styles.ideaCost}>
                  {idea.estimatedCost > headroom ? (
                    <Chip tone="warning">over budget</Chip>
                  ) : (
                    money(idea.estimatedCost)
                  )}
                </span>
              </div>
              <p className={styles.ideaWhy}>{idea.why}</p>
              <p className={styles.ideaMeta}>
                Book {plural(idea.leadTimeDays, 'day')} ahead · about {money(idea.estimatedCost)}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className={styles.note}>
        Suggestions come from a language model and the costs are its guesses, not quotes. Check any
        of them with a real vendor before counting on the figure.
      </p>
    </Card>
  );
}
