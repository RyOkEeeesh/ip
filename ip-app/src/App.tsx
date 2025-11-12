import { useState } from "react";
import "./App.css";

function isIpv4(ip: string) {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

// ipv4 -> int
function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

// int -> ipv4
// 1つのIPアドレスをドット区切りで表記する機能を実装すること
// サブネットマスクも同様
function intToIpc4(ip: number): string {
  return `${(ip >> 24) & 0xff}.${(ip >> 16) & 0xff}.${(ip >> 8) & 0xff}.${ip & 0xff}`;
}

// /N -> subnetMask
function maskFromLen(len: number): number {
  return (0xffffffff << (32 - len)) >>> 0;
}

// subnetMask -> /N
function LenFromMask(mask: number): number | null {
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
  ip: string;
  setIp: React.Dispatch<React.SetStateAction<number | null>>;
  placeholder: string;
  children?: React.ReactNode;
};

function InputIp({ labelTitle, ip, setIp, placeholder, children }: InputProps) {
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const ip = e.target.value;
    isIpv4(ip) ? setIp(ipv4ToInt(ip)) : setIp(null);
  }

  return (
    <>
      <div className="">
        <label htmlFor={labelTitle}>{labelTitle}</label>
        <input
          type="text"
          name={labelTitle}
          id={labelTitle}
          value={ip}
          placeholder={placeholder}
          onChange={handleInput}
        />
      </div>
      {children}
    </>
  );
}

type InputMaskProps = {
  mask: number;
  setMask: React.Dispatch<React.SetStateAction<number>>;
}

function InputMask() {}



function MutualCommunication() {
  // IPアドレスを1つのINT型変数に入れる
  const [ip, setIp] = useState<number | null>(null);
  // サブネットマスクも同様
  const [mask, setMask] = useState<number>(24);
}

export default function App() {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-500 to-pink-500 text-4xl font-bold text-white">
        Tailwind v4 Working! 🚀
      </div>
    </>
  );
}
