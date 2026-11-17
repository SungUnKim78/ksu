import { FARM_NAME } from "@/lib/settings";

export default function Privacy() {
  return (
    <main className="wrap">
      <section className="card prose">
        <h1>개인정보 수집·이용 안내</h1>
        <p>{FARM_NAME}은 토마토 주문과 배송을 위해 아래의 개인정보를 수집·이용합니다.</p>
        <dl className="info">
          <dt>수집 항목</dt>
          <dd>이름, 연락처, 배송 주소, 입금자명, 배송 메모 (카카오 로그인 이용 시 카카오 회원번호)</dd>
          <dt>이용 목적</dt>
          <dd>주문 접수, 입금 확인, 상품 배송, 주문 관련 안내, 재주문 시 배송 정보 자동 입력</dd>
          <dt>보유 기간</dt>
          <dd>관계 법령에 따른 보존 기간(거래 기록 5년) 동안 보관 후 파기합니다. 삭제를 요청하시면 법령상 보존 의무가 없는 정보는 바로 삭제합니다.</dd>
          <dt>제3자 제공</dt>
          <dd>배송을 위해 택배사에 받으시는 분의 이름, 연락처, 주소를 전달합니다.</dd>
        </dl>
        <p>동의하지 않으실 수 있으나, 이 경우 주문이 어렵습니다.</p>
        <p><a href="/">주문 페이지로 돌아가기</a></p>
      </section>
    </main>
  );
}
