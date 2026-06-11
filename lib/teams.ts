// 영어(모델 데이터) ↔ 한국어(named API) 팀명 매핑.
// named API 의 정확한 표기를 기준으로 작성 (2026 본선 48팀).

export const TEAM_KO: Record<string, string> = {
  Spain: "스페인",
  Argentina: "아르헨티나",
  France: "프랑스",
  England: "잉글랜드",
  Brazil: "브라질",
  Colombia: "콜롬비아",
  Portugal: "포르투갈",
  Ecuador: "에콰도르",
  Netherlands: "네덜란드",
  Germany: "독일",
  Japan: "일본",
  Morocco: "모로코",
  Mexico: "멕시코",
  Uruguay: "우루과이",
  Belgium: "벨기에",
  Croatia: "크로아티아",
  Norway: "노르웨이",
  Switzerland: "스위스",
  "United States": "미국",
  Senegal: "세네갈",
  Italy: "이탈리아",
  Austria: "오스트리아",
  Canada: "캐나다",
  Sweden: "스웨덴",
  Egypt: "이집트",
  "South Korea": "대한민국",
  Iran: "이란",
  Australia: "호주",
};

// 키에 공백/특수문자가 있는 팀은 별도로 안전하게 추가
TEAM_KO["Ivory Coast"] = "코트디부아르";
TEAM_KO["Saudi Arabia"] = "사우디아라비아";
TEAM_KO["South Africa"] = "남아공";
TEAM_KO["Czech Republic"] = "체코";
TEAM_KO["Bosnia and Herzegovina"] = "보스니아 헤르체고비나";
TEAM_KO["New Zealand"] = "뉴질랜드";
TEAM_KO["Cape Verde"] = "카보베르데";
TEAM_KO["DR Congo"] = "콩고민주공화국";
TEAM_KO["Curaçao"] = "퀴라소";
TEAM_KO["Ghana"] = "가나";
TEAM_KO["Haiti"] = "아이티";
TEAM_KO["Algeria"] = "알제리";
TEAM_KO["Jordan"] = "요르단";
TEAM_KO["Uzbekistan"] = "우즈베키스탄";
TEAM_KO["Iraq"] = "이라크";
TEAM_KO["Qatar"] = "카타르";
TEAM_KO["Panama"] = "파나마";
TEAM_KO["Paraguay"] = "파라과이";
TEAM_KO["Tunisia"] = "튀니지";
TEAM_KO["Turkey"] = "튀르키예";
TEAM_KO["Scotland"] = "스코틀랜드";

// 역방향: 한국어 → 영어 (named API 응답 매칭용)
export const TEAM_EN: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_KO).map(([en, ko]) => [ko, en]),
);

export function ko(en: string): string {
  return TEAM_KO[en] ?? en;
}

export function enFromKo(korean: string): string | null {
  return TEAM_EN[korean] ?? null;
}
