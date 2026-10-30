// Vercel 서버 함수: 브라우저 대신 odcloud API 를 호출해 주고 인증키는 서버에서만 사용한다.
// 주소·키는 Vercel 프로젝트 설정의 환경변수(JEJU_INFO_URL, JEJU_INFO_KEY, JEJU_LOCATION_URL, JEJU_LOCATION_KEY)에서 읽는다.
// /jeju/info, /jeju/location 요청은 vercel.json 의 rewrites 로 이 함수에 연결된다. (개발 중에는 vite.config.js 프록시가 같은 일을 함)
export default async function handler(req, res) {
  const which = req.query.which === 'location' ? 'LOCATION' : 'INFO'
  // 환경변수에 붙여 넣을 때 섞이기 쉬운 앞뒤 공백·줄바꿈·따옴표는 제거
  const clean = (v) => String(v || '').trim().replace(/^["']+|["']+$/g, '').trim()
  const url = clean(process.env[`JEJU_${which}_URL`])
  const key = clean(process.env[`JEJU_${which}_KEY`])
  if (!url || !key) {
    return res.status(500).json({ error: `환경변수 JEJU_${which}_URL / JEJU_${which}_KEY 가 설정되지 않았어요.` })
  }

  // 숫자만 허용 (그 외 값은 전달하지 않음)
  const num = (v, d) => (/^\d{1,4}$/.test(String(v)) ? String(v) : d)
  const q = new URLSearchParams({ page: num(req.query.page, '1'), perPage: num(req.query.perPage, '200') })
  const k = key.includes('%') ? key : encodeURIComponent(key)

  try {
    const r = await fetch(`${url}?${q}&serviceKey=${k}`)
    const text = await r.text()
    res.status(r.status)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.send(text)
  } catch (e) {
    res.status(502).json({ error: 'odcloud API 에 연결하지 못했어요.' })
  }
}
