import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subYears, addYears } from 'date-fns';

type TimeRange = 'all' | 'monthly';

interface MonthYearPickerProps {
  onChange: (startDate: string | null, endDate: string | null) => void;
  initialDate?: Date;
}

export function MonthYearPicker({ onChange, initialDate = new Date() }: MonthYearPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [rangeType, setRangeType] = useState<TimeRange>('monthly');
  
  // Generate years (5 years back and 5 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (rangeType === 'all') {
      // For 'All' option, pass null to indicate no date filtering
      onChange(null, null);
    } else {
      // For monthly view, calculate start and end of the selected month
      const startOfMonthDate = startOfMonth(selectedDate);
      const endOfMonthDate = endOfMonth(selectedDate);
      
      // Format dates as ISO strings (YYYY-MM-DD)
      const startDate = format(startOfMonthDate, 'yyyy-MM-dd');
      const endDate = format(endOfMonthDate, 'yyyy-MM-dd');
      
      onChange(startDate, endDate);
    }
  }, [selectedDate, rangeType, onChange]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleRangeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRangeType = e.target.value as TimeRange;
    setRangeType(newRangeType);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm border">
      <select
        value={rangeType}
        onChange={handleRangeTypeChange}
        className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="monthly">Monthly</option>
        <option value="all">All Time</option>
      </select>
      
      {rangeType === 'monthly' && (
        <>
          <select
            value={selectedDate.getMonth()}
            onChange={handleMonthChange}
            className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          
          <select
            value={selectedDate.getFullYear()}
            onChange={handleYearChange}
            className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
