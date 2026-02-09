import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function toLabel(yyyymm) {
  if (!yyyymm || !yyyymm.includes("-")) return "Pilih Bulan";
  const [y, m] = yyyymm.split("-");
  const idx = Number(m) - 1;
  const name = MONTH_NAMES_ID[idx] || m;
  return `${name} ${y}`;
}

export default function MonthDropdown({ value, onChange, testId, yearTestId, monthTestId }) {
  const year = useMemo(() => {
    const y = String(value || "").split("-")[0];
    return y && y.length === 4 ? y : String(new Date().getFullYear());
  }, [value]);

  const month = useMemo(() => {
    const m = String(value || "").split("-")[1];
    return m && m.length === 2 ? m : String(new Date().getMonth() + 1).padStart(2, "0");
  }, [value]);

  const yearOptions = useMemo(() => {
    const yNow = new Date().getFullYear();
    return [yNow - 1, yNow, yNow + 1].map(String);
  }, []);

  function setYear(y) {
    onChange(`${y}-${month}`);
  }

  function setMonth(mm) {
    onChange(`${year}-${mm}`);
  }

  return (
    <div data-testid={testId} className="flex items-center gap-2">
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger data-testid={yearTestId} className="h-10 w-[110px] rounded-xl">
          <SelectValue placeholder="Tahun" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem data-testid={`year-item-${y}`} key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger data-testid={monthTestId} className="h-10 w-[190px] rounded-xl">
          <SelectValue placeholder="Pilih Bulan" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES_ID.map((name, idx) => {
            const mm = String(idx + 1).padStart(2, "0");
            return (
              <SelectItem data-testid={`month-item-${mm}`} key={mm} value={mm}>
                {name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div data-testid="month-dropdown-label" className="hidden text-xs text-muted-foreground sm:block">
        {toLabel(`${year}-${month}`)}
      </div>
    </div>
  );
}
