import { useEffect, useMemo, useState } from 'react';
import { ipv4ToInt, isIpv4, minMaskFromIpNetwork, networkFromIpMask } from './ipUtils';

type IntIPv4 = number | null;

function useIpv4State(initial?: string) {
  // IPアドレスを1つのINT型変数に入れること
  const [ip, setIp] = useState<IntIPv4>(null);
  // サブネットマスクも同様
  const [mask, setMask] = useState<IntIPv4>(null);
  // ipアドレスinput用
  const [value, setValue] = useState(initial ?? '');
  const [network, setNetwork] = useState<IntIPv4>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setValue(value);
  }

  useEffect(() => {
    setIp(isIpv4(value) ? ipv4ToInt(value) : null);
  }, [value]);

  useEffect(() => {
    if (!ip || !mask) return;
    setNetwork(networkFromIpMask(ip, mask));
  }, [ip, mask]);

  useEffect(() => {
    if (!ip || !network) return;
    setMask(minMaskFromIpNetwork(ip, network));
  }, [ip, network])

  return { ip, mask, value,network, setIp, setMask, setValue, setNetwork, handleChange };
}

type InputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
};

function TextInput({
  label,
  placeholder,
  value,
  onChange,
  children,
}: InputProps) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        maxLength={15}
      />
      {children}
    </div>
  );
}

function MaskInput({
  label,
  maskInt,
  onMaskChange,
}: {
  label: string;
  maskInt: IntIPv4;
  onMaskChange: (newMask: IntIPv4) => void;
}) {
  const len = maskInt ? (lenFromMask(maskInt) ?? -1) : -1;

  function handleLenChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(e.target.value);
    onMaskChange(value === -1 ? null : maskFromLen(value));
  }

  const maskText = maskInt ? intToIpv4(maskInt) : '';
  return (
    <TextInput
      label={label}
      value={maskText}
      placeholder="255.255.255.0"
      onChange={(e) => {
        const v = e.target.value;
        if (isIpv4(v)) onMaskChange(ipv4ToInt(v));
        else onMaskChange(null);
      }}
    >
      <select value={len} onChange={handleLenChange}>
        <option value={-1}> / </option>
        {Array.from({ length: 33 }).map((_, i) => (
          <option key={i} value={i}>
            /{i}
          </option>
        ))}
      </select>
    </TextInput>
  );
}

function MutualInputBox({
  ipHook,
  maskInt,
  onMaskChange,
}: {
  ipHook: ReturnType<typeof useIpv4State>;
  maskInt: IntIPv4;
  onMaskChange: (newMask: IntIPv4) => void;
}) {
  return (
    <div className="mutual-box">
      <TextInput
        label="IP Address"
        placeholder="192.168.0.1"
        value={ipHook.text}
        onChange={ipHook.handleChange}
      />
      <MaskInput
        label="Subnet Mask"
        maskInt={maskInt}
        onMaskChange={onMaskChange}
      />
    </div>
  );
}

function MutualCommunication() {
  const ip1 = useIpv4State();
  const ip2 = useIpv4State();
  const [mask1, setMask1] = useState<IntIPv4>(null);
  const [mask2, setMask2] = useState<IntIPv4>(null);

  const canCommunicate = useMemo(() => {
    if (!ip1.intVal || !ip2.intVal || !mask1 || !mask2) return null;
    return (
      (ip1.intVal & mask2) === network(ip2.intVal, mask2) &&
      (ip2.intVal & mask1) === network(ip1.intVal, mask1)
    );
  }, [ip1.intVal, ip2.intVal, mask1, mask2]);

  useEffect(() => {
    if (canCommunicate !== null)
      console.log(`通信可能: ${canCommunicate ? 'Yes' : 'No'}`);
  }, [canCommunicate]);

  return (
    <div className="mutual-container">
      <MutualInputBox ipHook={ip1} maskInt={mask1} onMaskChange={setMask1} />
      <MutualInputBox ipHook={ip2} maskInt={mask2} onMaskChange={setMask2} />
      {canCommunicate !== null && (
        <p>通信可能: {canCommunicate ? '✅ Yes' : '❌ No'}</p>
      )}
    </div>
  );
}

export default function App() {
  return <MutualCommunication />;
}
