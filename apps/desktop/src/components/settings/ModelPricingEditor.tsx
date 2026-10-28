import { useTranslation } from "react-i18next";
import type { ModelCost, ModelTokenPrices } from "@pi-desktop/shared";
import { Field, Input, SettingsToggle } from "../ui";

const priceLabels = { input: "settings.modelPriceInput", output: "settings.modelPriceOutput",
  cacheRead: "settings.modelPriceCacheRead", cacheWrite: "settings.modelPriceCacheWrite" } as const;
const priceKeys = ["input", "output", "cacheRead", "cacheWrite"] as const;

export function ModelPricingEditor({ value, catalog, onChange, disabled = false }: {
  value?: ModelTokenPrices;
  catalog?: ModelCost;
  onChange: (value: ModelTokenPrices | undefined) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const defaults: ModelTokenPrices = {
    input: catalog?.input ?? 0, output: catalog?.output ?? 0,
    cacheRead: catalog?.cacheRead ?? 0, cacheWrite: catalog?.cacheWrite ?? 0,
  };
  return (
    <div className="model-pricing-editor">
      <SettingsToggle checked={value !== undefined} disabled={disabled}
        label={t("settings.modelPricingOverride")}
        onChange={() => onChange(value ? undefined : defaults)} />
      <p className="settings-help">{t("settings.modelPricingHint")}</p>
      {value ? (
        <div className="provider-chosen-limits">
          {priceKeys.map(key => (
            <Field key={key} label={t(priceLabels[key])}>
              <Input type="number" min="0" step="any" disabled={disabled}
                aria-label={t(priceLabels[key])}
                value={value[key]} onChange={event => {
                  const rate = Number(event.target.value);
                  if (Number.isFinite(rate) && rate >= 0) onChange({ ...value, [key]: rate });
                }} />
            </Field>
          ))}
        </div>
      ) : null}
    </div>
  );
}
