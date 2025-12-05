import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  intToIpv4,
  IP_MAX,
  ipv4ToInt,
  isIpv4,
  lenFromMask,
  maskFromLen,
  networkFromIpMask,
} from './ipUtils';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, DivideIcon, SlashIcon } from '@heroicons/react/20/solid';

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

function TextInput({ label, placeholder, ip, setIp, children, className }: TextInputProps) {
  const [value, setValue] = useState('');
  const isInternalRef = useRef<boolean>(false);

  useEffect(() => {
    if (ip === null) {
      if (!isInternalRef.current) setValue('');
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
      <div className="h-fit w-fit has-[.combobox]:flex">
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

const options: OptionType[] = Array.from({ length: IP_MAX + 1 }, (_, i) => ({
  value: i,
  label: `${i}`,
}));
options.unshift({ value: -1, label: '' });

type LenInputProps = {
  mask: IntIPv4;
  setMask: React.Dispatch<React.SetStateAction<IntIPv4>>;
};

function LenInput({ mask, setMask }: LenInputProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectOption, setSelectOption] = useState<OptionType>(options[0]);
  const [query, setQuery] = useState<string>('');

  const filterOption =
    query === ''
      ? options.filter(op => op.value !== -1)
      : options.filter(op => op.label.toLowerCase().includes(query.toLowerCase()));

  function findOption(len: number) {
    return options.find(o => o.value === len) ?? options[0];
  }

  useEffect(() => {
    if (mask === null) return;
    setSelectOption(findOption(lenFromMask(mask) ?? -1));
  }, [mask]);

  function handleSelect(op: OptionType | null) {
    if (op === null) {
      setSelectOption(options[0]);
      setMask(null);
      return;
    }

    setSelectOption(op);
    setMask(maskFromLen(op.value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    const inputVal = e.target.value;

    if (inputVal.length === 0) {
      setMask(null);
      return;
    }

    const val = Number(inputVal);
    setMask(isNaN(val) ? null : maskFromLen(val));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
      e.preventDefault();
      setIsOpen(true);
    }
  }

  return (
    <Combobox value={selectOption} onChange={handleSelect} onClose={() => setQuery('')}>
      {({ open }) => {
        // if (!open) setIsOpen(false);
        console.log(open && isOpen);
        return (
          <>
            <div className="combobox">
              <SlashIcon className="size-6" />
              <ComboboxInput
                onKeyDown={handleKeyDown}
                displayValue={(op: OptionType) => op?.label}
                onChange={handleChange}
                placeholder="24"
                maxLength={2}
                className="h-full w-6"
              />
              <ComboboxButton
                className="h-full"
                onClick={() => {
                  setIsOpen(open => !open);
                }}
              >
                <ChevronDownIcon className="size-6" />
              </ComboboxButton>
            </div>
            <ComboboxOptions anchor="bottom" className="absolute h-[30vh]">
              {filterOption.length > 0 ? (
                filterOption.map(op => (
                  <ComboboxOption
                    key={op.value}
                    value={op}
                    className="group flex cursor-pointer items-center p-2 data-focus:bg-blue-500 data-focus:text-white"
                  >
                    <CheckIcon className="invisible size-4 group-data-selected:visible" />
                    <div className="">{op.label}</div>
                  </ComboboxOption>
                ))
              ) : (
                <div className="relative cursor-default px-4 py-2 text-gray-700 select-none">
                  一致するオプションはありません
                </div>
              )}
            </ComboboxOptions>
          </>
        );
      }}
    </Combobox>
  );
}

function MutualInputBox({ ipHook }: { ipHook: ReturnType<typeof useIpv4State> }) {
  return (
    <div className="mutual-box">
      <TextInput
        className="border-input-border placeholder-input-placeholder h-input-h w-32 border border-r-0 px-3 py-0.5"
        label="IP Address"
        placeholder="192.168.0.1"
        ip={ipHook.ip}
        setIp={ipHook.setIp}
      >
        <LenInput mask={ipHook.mask} setMask={ipHook.setMask} />
      </TextInput>

      <TextInput
        className="border-input-border placeholder-input-placeholder h-input-h w-44 border px-2 py-0.5"
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
      (ipHooks[0].ip & ipHooks[1].mask) === networkFromIpMask(ipHooks[1].ip!, ipHooks[1].mask!) &&
      (ipHooks[1].ip & ipHooks[0].mask) === networkFromIpMask(ipHooks[0].ip!, ipHooks[0].mask!)
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
        {canCommunicate !== null && <p>通信可能: {canCommunicate ? '✅ Yes' : '❌ No'}</p>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-bgclr text-txclr h-full w-full transition-colors duration-300">
      <MutualCommunication />
    </div>
  );
}
