import React, { useState } from 'react';
import { format, parseISO, isBefore, isAfter } from 'date-fns';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setStartDate(date);
    if (endDate && isAfter(parseISO(date), parseISO(endDate))) {
      setEndDate(date);
    }
    if (date && endDate) {
      onDateRangeChange(date, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (startDate && isBefore(parseISO(date), parseISO(startDate))) {
      return; // Don't allow end date before start date
    }
    setEndDate(date);
    if (startDate) {
      onDateRangeChange(startDate, date);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm border">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">From:</label>
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">To:</label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={handleEndDateChange}
          className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!startDate}
        />
      </div>
    </div>
  );
}