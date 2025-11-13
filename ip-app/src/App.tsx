import { useState } from 'react';
import './App.css';

function isIpv4(ip: string) {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

// ipv4 -> int
function ipv4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

// int -> ipv4
// 1つのIPアドレスをドット区切りで表記する機能を実装すること
// サブネットマスクも同様
function intToIpv4(ip: number): string {
  return `${(ip >> 24) & 0xff}.${(ip >> 16) & 0xff}.${(ip >> 8) & 0xff}.${ip & 0xff}`;
}

// /N -> subnetMask
function maskFromLen(len: number): number {
  return (0xffffffff << (32 - len)) >>> 0;
}

// subnetMask -> /N
function lenFromMask(mask: number): number | null {
  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;

  let len = 0;
  for (let i = 31; i >= 0; i--) {
    if ((mask & (1 << i)) !== 0) len++;
    else break;
  }
  return len;
}

// ip + maskLen -> network
function network(ip: number, mask: number): number {
  return ip & mask;
}

type InputProps = {
  labelTitle: string;
  ip: number | null;
  setIp: React.Dispatch<React.SetStateAction<number | null>>;
  placeholder: string;
  children?: React.ReactNode;
};

function InputIp({ labelTitle, ip, setIp, placeholder, children }: InputProps) {
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const ip = e.target.value;
    setIp(isIpv4(ip) ? ipv4ToInt(ip) : null);
  }

  return (
    <>
      <div className="">
        <label htmlFor={labelTitle}>{labelTitle}</label>
        <input
          type="text"
          name={labelTitle}
          id={labelTitle}
          value={ip ? intToIpv4(ip) : ''}
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
  const len = mask && lenFromMask(mask);
  return (
    <InputIp
      labelTitle="subnet mask"
      ip={mask}
      setIp={setMask}
      placeholder="255.255.255.0"
    >
      <div className="">
        <label htmlFor="maskLen"></label>
        <select name="maskLen" id="maskLen" onChange={handleChange}>
          <option value={-1}> / </option>
          {Array.from({ length: 33 }).map((_, i) => (
            <option key={`option-${i}`} value={i} selected={len === i}>
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
