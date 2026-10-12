const formatDisplayDate = (dateString: string) => {
  if (!dateString) return "Не выбрано";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Не выбрано";

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default formatDisplayDate;
