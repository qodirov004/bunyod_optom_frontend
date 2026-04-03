export function numberToWords(num: number): string {
  if (num === 0) return 'zero';
  const belowTwenty = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  const thousandGroups = ['','thousand','million','billion','trillion'];
  const words: string[] = [];
  let i = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk) {
      let chunkWords = '';
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;
      if (hundreds) {
        chunkWords += `${belowTwenty[hundreds]} hundred`;
        if (remainder) chunkWords += ' ';
      }
      if (remainder < 20) {
        chunkWords += belowTwenty[remainder];
      } else {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        chunkWords += tens[ten];
        if (unit) chunkWords += `-${belowTwenty[unit]}`;
      }
      words.unshift(`${chunkWords} ${thousandGroups[i]}`.trim());
    }
    num = Math.floor(num / 1000);
    i++;
  }
  return words.join(' ').trim();
}
