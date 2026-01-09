import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export default function CustomDatePicker({ label, value, onChange, name }) {
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(newValue) =>
        onChange({
          target: {
            name,
            value: newValue ? newValue.toISOString() : "",
          },
        })
      }
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />
  );
}
