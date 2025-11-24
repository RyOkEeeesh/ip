import { useEffect, useId, useMemo, useState } from 'react';
import {
  intToIpv4,
  ipv4ToInt,
  isIpv4,
  lenFromMask,
  maskFromLen,
  networkFromIpMask,
} from './ipUtils';
import Select, {
  components,
  type FilterOptionOption,
  type SingleValue,
} from 'react-select';

// https://chatgpt.com/share/691e675e-d920-8009-8dca-8d4dd08641a5

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
  const [value, setValue] = useState('');

  // ip が null のときは空文字にする（以前は falsy 判定で 0 を無視していた）
  useEffect(() => {
    if (ip === null) {
      setValue('');
      return;
    }
    setValue(intToIpv4(ip));
  }, [ip]);

  function handleCHange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value;
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
          onChange={handleCHange}
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

const options: OptionType[] = Array.from({ length: 32 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));
options.unshift({ value: -1, label: '' });

type LeninputProps = {
  mask: IntIPv4;
  setMask: React.Dispatch<React.SetStateAction<IntIPv4>>;
};

function Leninput({ mask, setMask }: LeninputProps) {
  const [value, setValue] = useState('');

  useEffect(() => {}, [mask]);

  function handleCHange(e: SingleValue<OptionType>) {
    if (!e) return;
    setMask(e.value);
  }
  return <Select options={options} />;
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
        <Leninput mask={ipHook.ip} setMask={ipHook.setMask} />
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
