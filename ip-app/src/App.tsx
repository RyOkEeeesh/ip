import { useEffect, useState } from 'react';
import './App.css';
import {
  intToIpv4,
  ipv4ToInt,
  isIpv4,
  lenFromMask,
  maskFromLen,
  network,
} from './ipUtils';

type InputProps = {
  labelTitle: string;
  ip: number | null;
  setIp: React.Dispatch<React.SetStateAction<number | null>>;
  placeholder: string;
  children?: React.ReactNode;
};

function InputIp({ labelTitle, ip, setIp, placeholder, children }: InputProps) {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    setText(ip ? intToIpv4(ip) : '');
  }, [ip]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setText(value);
    if (isIpv4(value)) setIp(ipv4ToInt(value));
    else setIp(null);
  }

  return (
    <>
      <div>
        <label htmlFor={labelTitle}>{labelTitle}</label>
        <input
          type="text"
          name={labelTitle}
          id={labelTitle}
          value={text}
          placeholder={placeholder}
          onChange={handleInput}
          maxLength={15}
        />
      </div>
      {children}
    </>
  );
}

type InputMaskProps = {
  mask: number | null;
  setMask: React.Dispatch<React.SetStateAction<number | null>>;
};

function InputMask({ mask, setMask }: InputMaskProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const len = Number(e.target.value);
    setMask(len === -1 ? null : maskFromLen(len));
  }
  const len = (mask && lenFromMask(mask)) ?? -1;
  return (
    <InputIp
      labelTitle="subnet mask"
      ip={mask}
      setIp={setMask}
      placeholder="255.255.255.0"
    >
      <div className="">
        <label htmlFor="maskLen"></label>
        <select name="maskLen" id="maskLen" value={len} onChange={handleChange}>
          <option value={-1}> / </option>
          {Array.from({ length: 33 }).map((_, i) => (
            <option key={`option-${i}`} value={i}>
              /{i}
            </option>
          ))}
        </select>
      </div>
    </InputIp>
  );
}

type MutualCommunicationInputBoxProps = {
  ip: number | null;
  setIp: React.Dispatch<React.SetStateAction<number | null>>;
  mask: number | null;
  setMask: React.Dispatch<React.SetStateAction<number | null>>;
};

function MutualCommunicationInputBox({
  ip,
  setIp,
  mask,
  setMask,
}: MutualCommunicationInputBoxProps) {
  return (
    <div className="">
      <InputIp
        labelTitle="ip address"
        ip={ip}
        setIp={setIp}
        placeholder="192.168.0.1"
      />
      <InputMask mask={mask} setMask={setMask} />
    </div>
  );
}

function MutualCommunication() {
  // IPアドレスを1つのINT型変数に入れる
  const [ip1, setIp1] = useState<number | null>(null);
  const [ip2, setIp2] = useState<number | null>(null);
  // サブネットマスクも同様
  const [mask1, setMask1] = useState<number | null>(null);
  const [mask2, setMask2] = useState<number | null>(null);

  useEffect(() => {
    if (!ip1 || !ip2 || !mask1 || !mask2) return;
    console.log(
      (ip1 & mask2) === network(ip2, mask2) &&
        (ip2 & mask1) === network(ip1, mask1),
    );
  }, [ip1, ip2, mask1, mask2]);

  return (
    <div className="">
      <MutualCommunicationInputBox
        ip={ip1}
        setIp={setIp1}
        mask={mask1}
        setMask={setMask1}
      />
      <MutualCommunicationInputBox
        ip={ip2}
        setIp={setIp2}
        mask={mask2}
        setMask={setMask2}
      />
    </div>
  );
}

export default function App() {
  return (
    <>
      <MutualCommunication />
    </>
  );
}
