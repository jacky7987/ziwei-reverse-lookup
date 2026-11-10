import { analyze } from './core.js';
import { gregorianDates, validateYears } from './calendar.js';

self.onmessage = ({ data: { id, query, start, end } }) => {
  try {
    const result = analyze(query);
    let calendarError = validateYears(start, end);
    if (!calendarError) {
      try {
        for (const c of result.candidates) c.dates = gregorianDates(c, start, end);
      } catch (error) { calendarError = error.message; }
    }
    self.postMessage({ id, ...result, calendarError });
  } catch (error) { self.postMessage({ id, error: error.message }); }
};
