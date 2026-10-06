import { Button, IconButton } from '../../components/Button';
import { Input, Select } from '../../components/Field';
import { IconPlus, IconTrash } from '../../components/Icons';
import { Toggle } from '../../components/Toggle';
import { slugifyId, type FieldErrors } from '../../lib/forms';
import { newGroup, newOption, type GroupDraft, type OptionDraft } from './formState';

interface Props {
  groups: GroupDraft[];
  onChange: (groups: GroupDraft[]) => void;
  errors: FieldErrors;
}

const MAX_GROUPS = 10;
const MAX_OPTIONS = 20;

export function CustomizationsEditor({ groups, onChange, errors }: Props) {
  const updateGroup = (index: number, patch: Partial<GroupDraft>) =>
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const updateOption = (gi: number, oi: number, patch: Partial<OptionDraft>) => {
    const group = groups[gi];
    if (!group) return;
    updateGroup(gi, { options: group.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) });
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-sm text-muted">
          No customizations. Add a group for choices like size, milk or extra shots.
        </p>
      )}

      {groups.map((g, gi) => {
        const p = `customizations.${gi}`;
        const groupLabel = g.name.trim() || `Group ${gi + 1}`;
        return (
          <fieldset key={g.key} className="rounded-xl border border-line bg-warm/40">
            <legend className="sr-only">{groupLabel}</legend>
            <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.1fr_0.8fr_auto] lg:items-start">
              <Input
                label="Group name"
                placeholder="e.g. Size"
                value={g.name}
                maxLength={60}
                onChange={(e) =>
                  updateGroup(gi, {
                    name: e.target.value,
                    ...(g.idEdited ? {} : { id: slugifyId(e.target.value) }),
                  })
                }
                error={errors[`${p}.name`]}
              />
              <Input
                label="ID"
                value={g.id}
                maxLength={60}
                onChange={(e) => updateGroup(gi, { id: e.target.value, idEdited: true })}
                error={errors[`${p}.id`]}
                hint="Used in carts"
                className="font-mono text-[13px]"
              />
              <Select
                label="Type"
                value={g.type}
                onChange={(e) => updateGroup(gi, { type: e.target.value as GroupDraft['type'] })}
                error={errors[`${p}.type`]}
              >
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
              </Select>
              {g.type === 'multiple' ? (
                <Input
                  label="Max picks"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  placeholder="No limit"
                  value={g.maxSelect}
                  onChange={(e) => updateGroup(gi, { maxSelect: e.target.value })}
                  error={errors[`${p}.maxSelect`]}
                />
              ) : (
                <div className="hidden lg:block" />
              )}
              <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:pt-6">
                <Toggle size="sm" label="Required" checked={g.required} onChange={(v) => updateGroup(gi, { required: v })} />
                <IconButton
                  tone="danger"
                  label={`Remove ${groupLabel}`}
                  onClick={() => onChange(groups.filter((_, i) => i !== gi))}
                >
                  <IconTrash size={16} />
                </IconButton>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_32px] gap-3 text-[11px] font-bold tracking-wider text-muted uppercase sm:grid">
                <span>Option</span>
                <span>ID</span>
                <span>Extra price (₹)</span>
                <span />
              </div>
              {g.options.map((o, oi) => {
                const op = `${p}.options.${oi}`;
                const optionLabel = o.name.trim() || `option ${oi + 1}`;
                return (
                  <div key={o.key} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_32px] sm:items-start sm:gap-3">
                    <Input
                      label={`${groupLabel}: option name`}
                      srOnlyLabel
                      placeholder="e.g. Large"
                      value={o.name}
                      maxLength={60}
                      wrapperClassName="col-span-2 sm:col-span-1"
                      onChange={(e) =>
                        updateOption(gi, oi, {
                          name: e.target.value,
                          ...(o.idEdited ? {} : { id: slugifyId(e.target.value) }),
                        })
                      }
                      error={errors[`${op}.name`]}
                    />
                    <Input
                      label={`${optionLabel}: ID`}
                      srOnlyLabel
                      placeholder="id"
                      value={o.id}
                      maxLength={60}
                      className="font-mono text-[13px]"
                      onChange={(e) => updateOption(gi, oi, { id: e.target.value, idEdited: true })}
                      error={errors[`${op}.id`]}
                    />
                    <Input
                      label={`${optionLabel}: extra price`}
                      srOnlyLabel
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={o.price}
                      onChange={(e) => updateOption(gi, oi, { price: e.target.value })}
                      error={errors[`${op}.price`]}
                    />
                    <IconButton
                      label={`Remove ${optionLabel}`}
                      tone="danger"
                      className="mt-1 justify-self-end sm:justify-self-auto"
                      disabled={g.options.length <= 1}
                      onClick={() => updateGroup(gi, { options: g.options.filter((_, j) => j !== oi) })}
                    >
                      <IconTrash size={15} />
                    </IconButton>
                  </div>
                );
              })}
              {errors[`${p}.options`] && <p className="text-xs font-medium text-red-700">{errors[`${p}.options`]}</p>}
              <Button
                variant="ghost"
                size="sm"
                icon={<IconPlus size={14} />}
                disabled={g.options.length >= MAX_OPTIONS}
                onClick={() => updateGroup(gi, { options: [...g.options, newOption()] })}
              >
                Add option
              </Button>
            </div>
          </fieldset>
        );
      })}

      {errors.customizations && <p className="text-xs font-medium text-red-700">{errors.customizations}</p>}

      <Button
        variant="secondary"
        size="sm"
        icon={<IconPlus size={14} />}
        disabled={groups.length >= MAX_GROUPS}
        onClick={() => onChange([...groups, newGroup()])}
      >
        Add customization group
      </Button>
    </div>
  );
}
