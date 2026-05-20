import { DiagnosisErrorCode, type DiagnosisErrorDTO } from '@/lib/types/diagnosis';

/** DiagnosisErrorCode → 사용자 메시지·HTTP 상태 매핑 (8 키 — code/originalError 는 createDiagnosisError 가 채움) */
export const DIAG_ERROR_MAP: Record<DiagnosisErrorCode, Omit<DiagnosisErrorDTO, 'code' | 'originalError'>> = {
  [DiagnosisErrorCode.ADDRESS_MISSING]: {
    message: '출발지 주소를 입력해 주세요.',
    httpStatus: 400,
  },
  [DiagnosisErrorCode.ADDRESS_OUT_OF_COVERAGE]: {
    message: '현재는 수도권(서울·경기·인천) 만 서비스하고 있어요. 다른 동네 추가는 곧 열려요.',
    httpStatus: 400,
  },
  [DiagnosisErrorCode.DEADLINE_DATE_PAST]: {
    message: '데드라인 날짜는 오늘 이후로 설정해 주세요.',
    httpStatus: 400,
  },
  [DiagnosisErrorCode.NO_CANDIDATES_FOUND]: {
    message: '조건에 맞는 동네를 찾지 못했어요. 통근 시간이나 예산을 조정해 보세요.',
    httpStatus: 404,
  },
  [DiagnosisErrorCode.TRANSPORT_API_TIMEOUT]: {
    message: '교통 정보를 불러오는 데 시간이 너무 걸렸어요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 504,
  },
  [DiagnosisErrorCode.TRANSPORT_API_RETRY_FAILED]: {
    message: '교통 정보 조회에 반복 실패했어요. 잠시 후 다시 시도해 주세요.',
    httpStatus: 502,
  },
  [DiagnosisErrorCode.DIAGNOSIS_NOT_FOUND]: {
    message: '진단 결과를 찾을 수 없어요. 링크가 만료됐을 수 있어요.',
    httpStatus: 404,
  },
  [DiagnosisErrorCode.DIAGNOSIS_FORBIDDEN]: {
    message: '이 진단 결과를 볼 권한이 없어요.',
    httpStatus: 403,
  },
};
