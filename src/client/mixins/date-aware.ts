export class DateAwareMixin {
  public isDate(value: any): boolean {
    let result = false;
    const minEpochValue = 605692800000;
    const today = new Date();
    const tenYearsFromNow = today.setFullYear(today.getFullYear() + 10).valueOf();

    const isNumber = !isNaN(value);
    const isEpoch = +value > minEpochValue;
    const withinTenYears = +value < tenYearsFromNow;

    result = isNumber && isEpoch && withinTenYears;

    return result;
  }

  public toDate(epoch: number): string {
    const result = new Date(+epoch);
    return result.toISOString();
  }

  public toEpoch(date: Date): string {
    return date.valueOf().toString();
  }
}
