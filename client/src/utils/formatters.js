export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return dateStr;
  }
};
