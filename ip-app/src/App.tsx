import { useEffect, useMemo, useState } from 'react';
import './App.css';
import * as ipUtils from './ipUtils';

// カスタムフックでIP管理を共通化
function useIpv4State(initial?: string) {
  const [text, setText] = useState(initial ?? '');
  const [intVal, setIntVal] = useState<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setText(value);
    if (ipUtils.isIpv4(value)) setIntVal(ipUtils.ipv4ToInt(value));
    else setIntVal(null);
  }

  return { text, intVal, setText, setIntVal, handleChange };
}

type InputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
};

function TextInput({ label, placeholder, value, onChange, children }: InputProps) {
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
  maskInt: number | null;
  onMaskChange: (newMask: number | null) => void;
}) {
  const len = maskInt ? ipUtils.lenFromMask(maskInt) ?? -1 : -1;

  function handleLenChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = Number(e.target.value);
    onMaskChange(value === -1 ? null : ipUtils.maskFromLen(value));
  }

  const maskText = maskInt ? ipUtils.intToIpv4(maskInt) : '';
  return (
    <TextInput
      label={label}
      value={maskText}
      placeholder="255.255.255.0"
      onChange={(e) => {
        const v = e.target.value;
        if (ipUtils.isIpv4(v)) onMaskChange(ipUtils.ipv4ToInt(v));
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
  maskInt: number | null;
  onMaskChange: (newMask: number | null) => void;
}) {
  return (
    <div className="mutual-box">
      <TextInput
        label="IP Address"
        placeholder="192.168.0.1"
        value={ipHook.text}
        onChange={ipHook.handleChange}
      />
      <MaskInput label="Subnet Mask" maskInt={maskInt} onMaskChange={onMaskChange} />
    </div>
  );
}

function MutualCommunication() {
  const ip1 = useIpv4State();
  const ip2 = useIpv4State();
  const [mask1, setMask1] = useState<number | null>(null);
  const [mask2, setMask2] = useState<number | null>(null);

  const canCommunicate = useMemo(() => {
    if (!ip1.intVal || !ip2.intVal || !mask1 || !mask2) return null;
    return (
      (ip1.intVal & mask2) === ipUtils.network(ip2.intVal, mask2) &&
      (ip2.intVal & mask1) === ipUtils.network(ip1.intVal, mask1)
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
