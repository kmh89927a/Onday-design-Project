import type { CandidateArea } from "@/lib/types";

export interface ReportStat {
  label: string;
  value: string;
}

// share/single 페이지 ReportCard용 통근/시세/환승 stats
export function buildReportStats(c: CandidateArea): ReportStat[] {
  const stats: ReportStat[] = [
    { label: "A 통근", value: `${c.commuteA.time}분` },
  ];
  if (c.commuteB) {
    stats.push({ label: "B 통근", value: `${c.commuteB.time}분` });
  }
  if (c.priceRange) {
    const avg = (c.priceRange.min + c.priceRange.max) / 2;
    stats.push({
      label: "평균 시세",
      value: `${(avg / 10000).toFixed(1)}억`,
    });
  }
  const totalTransfers =
    (c.commuteA.transfers ?? 0) + (c.commuteB?.transfers ?? 0);
  stats.push({ label: "환승", value: `총 ${totalTransfers}회` });
  return stats;
}
