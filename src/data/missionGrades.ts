const GRADES = [
  { maxDeaths: 0, rank: 'S', label: 'CLEAN CLEAR', color: '#ffd780' },
  { maxDeaths: 1, rank: 'A', label: 'MISSION COMPLETE', color: '#80ffb0' },
  { maxDeaths: 3, rank: 'B', label: 'MISSION COMPLETE', color: '#9fe8ff' },
  { maxDeaths: Infinity, rank: 'C', label: 'MISSION COMPLETE', color: '#d5ddea' },
] as const;

export const missionGrade = (deaths: number) => GRADES.find(grade => deaths <= grade.maxDeaths) ?? GRADES[3];
