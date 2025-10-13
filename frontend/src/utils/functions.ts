// Converts a number into a shortened format.
export const shortenNumber = (num: number): string => {
  if (!num && num !== 0) return "0";

  const absNum = Math.abs(num);
  let result: string;

  if (absNum >= 1e9) {
    result = `${(num / 1e9).toFixed(1)}B`;
  } else if (absNum >= 1e6) {
    result = `${(num / 1e6).toFixed(1)}M`;
  } else if (absNum >= 1e5) {
    // Keep 10,000+ short as 10k
    result = `${(num / 1e3).toFixed(1)}k`;
  } else {
    // Format with commas (e.g. 1,000 or 999)
    result = num.toLocaleString();
  }

  // Remove trailing ".0" before unit (e.g. 1.0M → 1M)
  result = result.replace(/\.0+([kMB])$/, "$1");

  return result;
};
