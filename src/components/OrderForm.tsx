"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { createOrder, type OrderState } from "@/app/actions";

type Props = {
  price3: number;
  price5: number;
  token?: string;
  source: string;
  returning: boolean;
  initial: {
    name: string;
    phone: string;
    postcode: string;
    address: string;
    addressDetail: string;
    qty3: number;
    qty5: number;
  };
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (d: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
      }) => { open: () => void };
    };
  }
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

function Stepper({ label, sub, value, onChange }: {
  label: string; sub: string; value: number; onChange: (n: number) => void;
}) {
  return (
    <div className={"option" + (value > 0 ? " on" : "")}>
      <div>
        <div className="option-name">{label}</div>
        <div className="option-price">{sub}</div>
      </div>
      <div className="stepper">
        <button type="button" aria-label={`${label} 줄이기`} disabled={value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span aria-live="polite">{value}</span>
        <button type="button" aria-label={`${label} 늘리기`} disabled={value >= 30}
          onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function OrderForm({ price3, price5, token, source, returning, initial }: Props) {
  const [state, action, pending] = useActionState<OrderState, FormData>(createOrder, null);
  const [qty3, setQty3] = useState(initial.qty3);
  const [qty5, setQty5] = useState(initial.qty5);
  const [postcode, setPostcode] = useState(initial.postcode);
  const [address, setAddress] = useState(initial.address);
  const total = qty3 * price3 + qty5 * price5;

  // 오류가 나도 입력한 내용이 지워지지 않도록 직접 전송합니다.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  function searchAddress() {
    const open = () =>
      new window.daum!.Postcode({
        oncomplete: (d) => {
          setPostcode(d.zonecode);
          setAddress(d.roadAddress || d.jibunAddress);
          document.getElementById("addressDetail")?.focus();
        },
      }).open();
    if (window.daum?.Postcode) return open();
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = open;
    s.onerror = () => alert("주소 검색을 불러오지 못했습니다. 주소를 직접 입력해 주세요.");
    document.head.appendChild(s);
  }

  return (
    <form onSubmit={onSubmit} className="card form">
      <input type="hidden" name="token" value={token ?? ""} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="qty3" value={qty3} />
      <input type="hidden" name="qty5" value={qty5} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

      <h2>1. 수량 선택</h2>
      <Stepper label="토마토 3kg" sub={won(price3)} value={qty3} onChange={setQty3} />
      <Stepper label="토마토 5kg" sub={won(price5)} value={qty5} onChange={setQty5} />

      <h2>2. 배송 정보</h2>
      {returning && <p className="hint ok">지난번 배송 정보를 채워 두었습니다. 바뀐 곳만 고쳐 주세요.</p>}
      <label>받으시는 분
        <input name="name" defaultValue={initial.name} autoComplete="name" required maxLength={30} />
      </label>
      <label>연락처
        <input name="phone" defaultValue={initial.phone} type="tel" inputMode="tel" autoComplete="tel"
          placeholder="010-0000-0000" required maxLength={20} />
      </label>
      <label>주소
        <div className="row">
          <input name="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)}
            placeholder="우편번호" inputMode="numeric" maxLength={10} className="zip" />
          <button type="button" className="btn-sub" onClick={searchAddress}>주소 검색</button>
        </div>
        <input name="address" value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder="도로명 주소" required maxLength={200} />
        <input id="addressDetail" name="addressDetail" defaultValue={initial.addressDetail}
          placeholder="상세 주소 (동·호수)" maxLength={100} />
      </label>
      <label>배송 메모 <span className="opt">선택</span>
        <input name="memo" placeholder="예: 문 앞에 놓아 주세요" maxLength={200} />
      </label>
      <label>입금자명 <span className="opt">받으시는 분과 다를 때만</span>
        <input name="depositor" maxLength={30} />
      </label>

      <label className="check">
        <input type="checkbox" name="consent" defaultChecked={returning} />
        <span>주문·배송을 위한 <a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다.</span>
      </label>

      <div className="total">
        <span>결제 금액 <small>무료배송</small></span>
        <strong>{won(total)}</strong>
      </div>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn-main" disabled={pending || total === 0}>
        {pending ? "주문 접수 중…" : "주문하기"}
      </button>
      <p className="hint center">주문 후 안내되는 계좌로 입금하시면 발송해 드립니다.</p>
    </form>
  );
}
