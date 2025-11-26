import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  intToIpv4,
  IP_MAX,
  IP_MIN,
  ipv4ToInt,
  isIpv4,
  lenFromMask,
  maskFromLen,
  networkFromIpMask,
} from './ipUtils';

type IntIPv4 = number | null;

function useIpv4State() {
  const [ip, setIp] = useState<IntIPv4>(null);
  const [mask, setMask] = useState<IntIPv4>(null);
  return { ip, mask, setIp, setMask };
}

type TextInputProps = {
  label: string;
  placeholder?: string;
  ip: IntIPv4;
  setIp: React.Dispatch<React.SetStateAction<IntIPv4>>;
  children?: React.ReactNode;
  className?: string;
};

function TextInput({
  label,
  placeholder,
  ip,
  setIp,
  children,
  className,
}: TextInputProps) {
  const [value, setValue] = useState("");
  const isInternalRef = useRef<boolean>(false);

  useEffect(() => {
    if (ip === null) {
      if (!isInternalRef.current) setValue("");
      return;
    } else {
      const formatted = intToIpv4(ip);
      if (formatted !== value) setValue(formatted);
    }
    isInternalRef.current = false;
  }, [ip]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value;
    isInternalRef.current = true;
    setValue(t);
    setIp(isIpv4(t) ? ipv4ToInt(t) : null);
  }

  const generatedId = useId();

  return (
    <>
      <label className="block" htmlFor={generatedId}>
        {label}
      </label>
      <div className="input-wrap">
        <input
          type="text"
          className={className}
          id={generatedId}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          maxLength={15}
        />
        {children}
      </div>
    </>
  );
}

type OptionType = {
  value: number;
  label: string;
};

const options: OptionType[] = Array.from({ length: 33 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));
options.unshift({ value: -1, label: '' });

type LeninputProps = {
  mask: IntIPv4;
  setMask: React.Dispatch<React.SetStateAction<IntIPv4>>;
};

function Leninput({ mask, setMask }: LeninputProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');

  function findOption(len: number) {
    return options.find((o) => o.value === len) ?? options[0];
  }

  useEffect(() => {
    if (mask === null) return;
    setValue(findOption(lenFromMask(mask) ?? -1).label);
  }, [mask]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if (e.target.value.length === 0) {
      setMask(null);
      return;
    }
    const val = Number(e.target.value);
    setMask(isNaN(val) ? null : maskFromLen(val));
  }

  return (
    <div className="">
      <input
        onChange={handleInputChange}
        value={value}
        type="text"
        name="len"
        id="len"
        maxLength={2}
      />
      <svg
        className="text-txclr h-5 w-5"
        height="20"
        width="20"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
      </svg>
    </div>
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
        className=""
        label="IP Address"
        placeholder="192.168.0.1"
        ip={ipHook.ip}
        setIp={ipHook.setIp}
      >
        <Leninput mask={ipHook.mask} setMask={ipHook.setMask} />
      </TextInput>

      <TextInput
        className="input-mask"
        label="Subnet Mask"
        ip={ipHook.mask}
        setIp={ipHook.setMask}
        placeholder="255.255.255.0"
      />
    </div>
  );
}

function MutualCommunication() {
  const ipHooks = [useIpv4State(), useIpv4State()];

  const canCommunicate: boolean | null = useMemo(() => {
    if (
      ipHooks[0].ip === null ||
      ipHooks[1].ip === null ||
      ipHooks[0].mask === null ||
      ipHooks[1].mask === null
    )
      return null;
    return (
      (ipHooks[0].ip & ipHooks[1].mask) ===
        networkFromIpMask(ipHooks[1].ip!, ipHooks[1].mask!) &&
      (ipHooks[1].ip & ipHooks[0].mask) ===
        networkFromIpMask(ipHooks[0].ip!, ipHooks[0].mask!)
    );
  }, [ipHooks[0].ip, ipHooks[1].ip, ipHooks[0].mask, ipHooks[1].mask]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex gap-2">
        {ipHooks.map((ipHook, i) => (
          <div key={`box-${i}`}>
            <p className="text-center">IP {i + 1}</p>
            <MutualInputBox ipHook={ipHook} />
          </div>
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
  return (
    <div id="wrapper">
      <MutualCommunication />
    </div>
  );
}
