import type { EventPack, VariableValues } from '@shared/engine';
import { controlStyles } from '@/ui/controlStyles';
import { fillStyle } from '@/ui/fillStyle';
import styles from './budget.module.css';

/**
 * Every lever in the pack, rendered from its own definition.
 *
 * Choices are laid out as a row of options rather than hidden inside a drop
 * down: which ones exist, and how far the chosen one sits from the cheap end,
 * is half of what somebody is trying to work out.
 */
export function Levers({
  pack,
  values,
  onChange,
}: {
  pack: EventPack;
  values: VariableValues;
  onChange: (variableId: string, value: number | string) => void;
}): React.JSX.Element {
  return (
    <div className={styles.levers}>
      {pack.variables.map((variable) => {
        const id = `lever-${variable.id}`;

        if (variable.kind === 'number') {
          const stored = values[variable.id];
          const value = typeof stored === 'number' ? stored : variable.fallback;
          return (
            <div key={variable.id} className={styles.lever}>
              <div className={styles.leverHead}>
                <label htmlFor={id}>{variable.label}</label>
                <span className={styles.leverValue}>
                  {value}
                  {variable.unit === undefined ? '' : ` ${variable.unit}`}
                </span>
              </div>
              <input
                id={id}
                className={controlStyles.range}
                style={fillStyle((value - variable.min) / (variable.max - variable.min))}
                type="range"
                min={variable.min}
                max={variable.max}
                step={variable.step}
                value={value}
                onChange={(event) => {
                  onChange(variable.id, Number(event.target.value));
                }}
              />
              <p className={styles.leverHelp}>{variable.help}</p>
            </div>
          );
        }

        const storedChoice = values[variable.id];
        const chosen = typeof storedChoice === 'string' ? storedChoice : variable.fallback;
        const note = variable.options.find((option) => option.id === chosen)?.note;

        return (
          <div key={variable.id} className={styles.lever}>
            <div className={styles.leverHead} id={`${id}-label`}>
              <span>{variable.label}</span>
              {/* What the chosen option means, on the label's own line. As a
                  block underneath it was two reserved lines per lever and the
                  largest run of small grey text on the screen. */}
              <span className={styles.leverNote}>{note ?? variable.help}</span>
            </div>
            <div className={styles.options} role="radiogroup" aria-labelledby={`${id}-label`}>
              {variable.options.map((option) => (
                <label
                  key={option.id}
                  className={styles.option}
                  data-on={option.id === chosen ? 'true' : undefined}
                >
                  <input
                    type="radio"
                    name={id}
                    value={option.id}
                    checked={option.id === chosen}
                    onChange={() => {
                      onChange(variable.id, option.id);
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
