import { useEffect, useId, useMemo, useState } from 'react';
import {
  intToIpv4,
  ipv4ToInt,
  isIpv4,
  lenFromMask,
  maskFromLen,
  networkFromIpMask,
} from './ipUtils';

type IntIPv4 = number | null;

function useIpv4State() {
  // IPアドレスを1つのINT型変数に入れること
  const [ip, setIp] = useState<IntIPv4>(null);
  // サブネットマスクも同様
  const [mask, setMask] = useState<IntIPv4>(null);
  return { ip, mask, setIp, setMask };
}

function TextInput({
  label,
  placeholder,
  ip,
  setIp,
  children,
}: {
  label: string;
  placeholder?: string;
  ip: IntIPv4;
  setIp: React.Dispatch<React.SetStateAction<IntIPv4>>;
  children?: React.ReactNode;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!ip) return;
    setText(intToIpv4(ip));
  }, [ip]);

  function handleCHange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setText(text);
    setIp(isIpv4(text) ? ipv4ToInt(text) : null);
  }

  const generatedId = useId();

  return (
    <div className="flex gap-1">
      <label className="block w-24" htmlFor={generatedId}>{label}</label>
      <input
        type="text"
        id={generatedId}
        value={text}
        placeholder={placeholder}
        onChange={handleCHange}
        maxLength={15}
      />
      {children}
    </div>
  );
}

function MaskInput({
  label,
  mask,
  setMask,
}: {
  label: string;
  mask: IntIPv4;
  setMask: React.Dispatch<React.SetStateAction<IntIPv4>>;
}) {
  const len = mask ? (lenFromMask(mask) ?? -1) : -1;

  function handleLenChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const len = Number(e.target.value);
    setMask(len === -1 ? null : maskFromLen(len));
  }

  return (
    <TextInput
      label={label}
      ip={mask}
      setIp={setMask}
      placeholder="255.255.255.0"
    >
      <select className="" value={len} onChange={handleLenChange}>
        <option value={-1}> / </option>
        {Array.from({ length: 33 }).map((_, i) => (
          <option key={`option-${i}`} value={i}>
            /{i}
          </option>
        ))}
      </select>
    </TextInput>
  );
}

function MutualInputBox({
  ipHook,
}: {
  ipHook: ReturnType<typeof useIpv4State>;
}) {
  return (
    <div className="mutual-box">
      <TextInput
        label="IP Address"
        placeholder="192.168.0.1"
        ip={ipHook.ip}
        setIp={ipHook.setIp}
      />
      <MaskInput
        label="Subnet Mask"
        mask={ipHook.mask}
        setMask={ipHook.setMask}
      />
    </div>
  );
}

function MutualCommunication() {
  const ipHooks = [useIpv4State(), useIpv4State()];

  const canCommunicate: boolean | null = useMemo(() => {
    if (
      !ipHooks[0].ip ||
      !ipHooks[1].ip ||
      !ipHooks[0].mask ||
      !ipHooks[1].mask
    )
      return null;
    return (
      (ipHooks[0].ip & ipHooks[1].mask) ===
        networkFromIpMask(ipHooks[1].ip, ipHooks[1].mask) &&
      (ipHooks[1].ip & ipHooks[0].mask) ===
        networkFromIpMask(ipHooks[0].ip, ipHooks[0].mask)
    );
  }, [ipHooks[0].ip, ipHooks[1].ip, ipHooks[0].mask, ipHooks[1].mask]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="flex gap-2">
        {ipHooks.map((ipHook, i) => (
          <MutualInputBox key={`box-${i}`} ipHook={ipHook} />
        ))}
      </div>
      <div className="">
        {canCommunicate !== null && (
          <p>通信可能: {canCommunicate ? '✅ Yes' : '❌ No'}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <MutualCommunication />;
}
