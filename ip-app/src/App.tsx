import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  intToIpv4,
  IP_MAX,
  ipv4ToInt,
  isIpv4,
  isMask,
  lenFromMask,
  maskFromLen,
  networkFromIpMask,
} from './ipUtils';
import { Input, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, SlashIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

type IntIPv4 = number | null;

function useIpv4State() {
  const [ip, setI] = useState<IntIPv4>(null);
  const [mask, setM] = useState<IntIPv4>(null);
  function setIp(i: IntIPv4) {
    if (ip !== i) setI(i);
  }
  function setMask(m: IntIPv4) {
    if (mask !== m) setM(m !== null && isMask(m) ? m : null);
  }
  return { ip, mask, setIp, setMask };
}

type TextInputProps = {
  label: string;
  placeholder?: string;
  ip: IntIPv4;
  setIp: (v: IntIPv4) => void;
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
  const isInternalRef = useRef<boolean>(false);

  useEffect(() => {
    if (ip === null) {
      if (!isInternalRef.current) setValue('');
    } else {
      setValue(intToIpv4(ip));
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
      <label className='block' htmlFor={generatedId}>
        {label}
      </label>
      <div className='input-wrap'>
        <Input
          type='text'
          autoComplete='off'
          className={clsx(className, 'outline-none bg-transparent', ip !== null ? 'focus:focus:shadow-[inset_0_-2px_0_0_#a3e635]' : 'focus:shadow-[inset_0_-2px_0_0_#ef4444]')}
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

const options: OptionType[] = Array.from({ length: IP_MAX + 1 }, (_, i) => ({
  value: i,
  label: `${i}`,
}));
options.unshift({ value: -1, label: '' });

type LenInputProps = {
  mask: IntIPv4;
  setMask: (v: IntIPv4) => void;
};

function Leninput({ mask, setMask }: LenInputProps) {
  const [query, setQuery] = useState<string>('');
  const [select, setSelect] = useState<OptionType>(null!)

  function findOption(len: number) {
    return options.find(o => o.value === len) ?? options[0];
  }

  useEffect(() => {
    const select = findOption(lenFromMask(mask ?? -1) ?? -1)
    setQuery(select.label)
    setSelect(select);
  }, [mask]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    const inputVal = e.target.value;

    if (inputVal.length === 0) {
      setMask(null);
      return;
    }

    const val = Number(inputVal);
    setMask(isNaN(val) ? null : maskFromLen(val));
  }

  function handleSelect(op: OptionType | null) {
    if (op === null) {
      setSelect(options[0]);
      setMask(null);
      return;
    }
    setQuery(op.label);
    setSelect(op);
    setMask(maskFromLen(op.value));
  }

  return (
    <>
      <Input
        type='text'
        autoComplete='off'
        className={clsx('input-len', 'outline-none bg-transparent', mask !== null ? 'focus:focus:shadow-[inset_0_-2px_0_0_#a3e635]' : 'focus:shadow-[inset_0_-2px_0_0_#ef4444]')}
        value={query}
        placeholder='24'
        onChange={handleInputChange}
        maxLength={2}
      />
      <Listbox
        value={select}
        onChange={handleSelect}
      >
        <ListboxButton>
          <ChevronDownIcon className='size-5' />
        </ListboxButton>
        <ListboxOptions className='options'>
          {options.filter(op => op.value !== -1).map(op =>
            <ListboxOption
              className='group flex cursor-default items-center gap-2 rounded-lg px-3 py-1.5 select-none data-focus:bg-white/10'
              key={op.value}
              value={op}
            >
              <CheckIcon className='invisible size-4 group-data-selected:visible' />
              {op.label}
            </ListboxOption>
          )}
        </ListboxOptions>
      </Listbox>
    </>
  );
}

function MutualInputBox({ ipHook }: { ipHook: ReturnType<typeof useIpv4State> }) {
  return (
    <div className='mutual-box'>
      <TextInput
        className='input-ip'
        label='IP Address'
        placeholder='192.168.0.1'
        ip={ipHook.ip}
        setIp={ipHook.setIp}
      >
        <div className='h-full flex items-center gap-1 pr-1'>
          <SlashIcon className='size-5' />
          <Leninput mask={ipHook.mask} setMask={ipHook.setMask} />
        </div>
      </TextInput>
      <TextInput
        className='input-mask'
        label='Subnet Mask'
        ip={ipHook.mask}
        setIp={ipHook.setMask}
        placeholder='255.255.255.0'
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
    <div className='flex h-full w-full flex-col items-center justify-center'>
      <div className='flex gap-4'>
        {ipHooks.map((ipHook, i) => (
          <div key={`box-${i}`}>
            <p className='text-center'>IP {i + 1}</p>
            <MutualInputBox ipHook={ipHook} />
          </div>
        ))}
      </div>
      <div className='h-4'>
        {canCommunicate !== null && <p className={clsx(canCommunicate ? 'text-lime-400' : 'text-red-400')}>{canCommunicate ? '通信可能' : '通信不可能'}</p>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className='bg-bgclr text-txclr h-full w-full transition-colors duration-300'>
      <MutualCommunication />
    </div>
  );
}
