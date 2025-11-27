export const prepareSMSUrl = (numbers: string, body: string) => {
  // For multiple numbers, Android supports sms:number1,number2?body=...
  // For iOS you might need sms:&body=
  const encoded = encodeURIComponent(body);
  if (numbers && numbers.length > 0) {
    return `sms:${numbers}?body=${encoded}`;
  }
  return `sms:?body=${encoded}`;
};
