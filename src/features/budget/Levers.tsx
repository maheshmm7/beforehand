import type { EventPack, VariableValues } from '@shared/engine';
import { Field } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import { fillStyle } from '@/ui/fillStyle';
import styles from './budget.module.css';

/** Every lever in the pack, rendered from its own definition. */
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
        const stored = values[variable.id];

        if (variable.kind === 'number') {
          const value = typeof stored === 'number' ? stored : variable.fallback;
          return (
            <Field
              key={variable.id}
              htmlFor={id}
              label={variable.label}
              value={`${String(value)}${variable.unit === undefined ? '' : ` ${variable.unit}`}`}
              help={variable.help}
            >
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
            </Field>
          );
        }

        const chosen = typeof stored === 'string' ? stored : variable.fallback;
        const note = variable.options.find((option) => option.id === chosen)?.note;

        return (
          <Field key={variable.id} htmlFor={id} label={variable.label} help={note ?? variable.help}>
            <select
              id={id}
              className={controlStyles.select}
              value={chosen}
              onChange={(event) => {
                onChange(variable.id, event.target.value);
              }}
            >
              {variable.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        );
      })}
    </div>
  );
}
