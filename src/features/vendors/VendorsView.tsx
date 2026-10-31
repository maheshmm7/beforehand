import { useState } from 'react';
import type { Plan } from '@shared/plan';
import { money, plural } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { useWorkspace } from '@/state/useWorkspace';
import { newId } from '@/state/workspace';
import { Button, Card, Chip } from '@/ui/controls';
import { QuoteForm } from './QuoteForm';
import styles from './vendors.module.css';

export function VendorsView({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { current, scenario } = usePlanModel(plan);
  const [editing, setEditing] = useState<string | null>(null);

  const unpromised = current.lines.filter((line) => line.state === 'estimated');
  const promised = current.lines.filter((line) => line.state !== 'estimated');

  return (
    <div className={styles.view}>
      <Card
        className={styles.checklist}
        title={`Still nobody’s promise — ${plural(unpromised.length, 'line')}`}
      >
        <div className={styles.list}>
          {current.lines.map((line) => (
            <div key={line.ruleId} className={styles.entry}>
              <div className={styles.row}>
                <div>
                  <span className={styles.name}>
                    {line.label}
                    {/* The card is titled "still nobody's promise": saying
                        "estimated" on every row in it adds nothing. */}
                    {line.state === 'estimated' ? null : (
                      <Chip tone={line.state}>{line.state}</Chip>
                    )}
                  </span>
                  {/* The arithmetic behind the figure, on the one screen
                      that is a list of the figures. How much notice the
                      decision needs is the timeline's job, and saying it
                      twice cost this row a second line. */}
                  <span className={styles.detail}>
                    {line.basis}
                    {line.vendor === undefined ? '' : ` · ${line.vendor}`}
                  </span>
                  {line.quote === undefined || line.quote === '' ? null : (
                    <span className={styles.evidence}>“{line.quote}”</span>
                  )}
                </div>
                <div className={styles.right}>
                  <span className={styles.amount}>
                    {money(line.amount)}
                    {/* What the model had guessed, kept beside what somebody
                        actually quoted: the difference is the whole point of
                        writing the quote down. */}
                    {line.state !== 'estimated' && line.amount !== line.estimate ? (
                      <span className={styles.was}>we estimated {money(line.estimate)}</span>
                    ) : null}
                  </span>
                  <Button
                    small
                    onClick={() => {
                      setEditing(editing === line.ruleId ? null : line.ruleId);
                    }}
                  >
                    {line.state === 'estimated' ? 'Record a quote' : 'Edit'}
                  </Button>
                </div>
              </div>

              {editing === line.ruleId ? (
                <QuoteForm
                  line={line}
                  onCancel={() => {
                    setEditing(null);
                  }}
                  onSave={(commitment) => {
                    dispatch({
                      type: 'addCommitment',
                      planId: plan.id,
                      commitment: { ...commitment, id: newId('c') },
                    });
                    setEditing(null);
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {promised.length === 0 ? null : (
        <Card title="What has actually been promised">
          <p className={styles.intro}>
            {plural(promised.length, 'line')} of {String(current.lines.length)} are backed by a real
            price. Together that is {money(current.totals.quoted + current.totals.paid)}.
          </p>
          {scenario.commitments.map((commitment) => (
            <div key={commitment.id} className={styles.row}>
              <div>
                <span className={styles.name}>{commitment.vendor}</span>
                <span className={styles.detail}>
                  {current.lines.find((line) => line.ruleId === commitment.ruleId)?.label ??
                    commitment.ruleId}
                </span>
              </div>
              <div className={styles.right}>
                <span className={styles.amount}>{money(commitment.amount)}</span>
                <Button
                  small
                  variant="ghost"
                  ariaLabel={`Remove the quote from ${commitment.vendor}`}
                  onClick={() => {
                    dispatch({
                      type: 'removeCommitment',
                      planId: plan.id,
                      commitmentId: commitment.id,
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
