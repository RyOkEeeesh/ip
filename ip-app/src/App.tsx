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
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDownIcon, SlashIcon } from '@heroicons/react/20/solid';
import { ValueContainer } from 'react-select/animated';

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

const options: OptionType[] = Array.from({ length: IP_MAX + 1 }, (_, i) => ({
  value: i,
  label: `${i}`,
}));
options.unshift({ value: -1, label: '' });

type LenInputProps = {
  mask: IntIPv4;
  setMask: React.Dispatch<React.SetStateAction<IntIPv4>>;
};

function Leninput({ mask, setMask }: LenInputProps) {
  // OptionType を選択オブジェクト全体として保持する
  const [selectOption, setSelectOption] = useState<OptionType>(options[0]);
  const [query, setQuery] = useState<string>('');

  // 修正 2: queryが空の時は全てのオプションを表示する
  const filterOption = query === ''
    ? options
    : options.filter(op => op.label.toLowerCase().includes(query.toLowerCase()));

  // ... (findOption, useEffect は変更なし)

  // 外部からの選択と内部の入力の連携
  function handleSelect(newOption: OptionType | null) {
    if (newOption === null) {
      setSelectOption(options[0]);
      setMask(null);
      return;
    }
    
    // 選択されたオプション全体を保持
    setSelectOption(newOption); 
    
    // 外部の setMask にも値を反映
    setMask(maskFromLen(newOption.value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    const inputVal = e.target.value;

    if (inputVal.length === 0) {
      setMask(null);
      return;
    }
    
    // ここで直接 setMask を呼び出すロジックは残しつつ、
    // queryの変更が選択肢のフィルタリングにも使われる
    const val = Number(inputVal);
    setMask(isNaN(val) ? null : maskFromLen(val));
  }

  return (
    <Combobox
      value={selectOption}
      // 修正 1: onChangeで受け取るのはオブジェクト全体にする
      onChange={handleSelect} 
      onClose={() => setQuery('')}
    >
      <div className="flex relative"> {/* CSSの調整が必要ならここに追加 */}
        <ComboboxInput
          // displayValueはselectOptionオブジェクトからlabelを抽出
          displayValue={(op: OptionType) => op?.label}
          onChange={handleChange}
          placeholder='24'
          maxLength={2}
          className="border border-gray-300 rounded-l p-2 w-full"
        />
        <ComboboxButton className="p-2 border border-gray-300 rounded-r bg-gray-50 hover:bg-gray-100">
          <ChevronDownIcon className='size-4' />
        </ComboboxButton>
      </div>
      <ComboboxOptions
        anchor="bottom"
        className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded max-h-60 overflow-auto border border-gray-200"
      >
        {/* フィルタリングされたオプションの長さが0でなければ表示 */}
        {filterOption.length > 0 ? (
          filterOption.map(op =>
            <ComboboxOption
              key={op.value}
              // 修正 1: valueにオブジェクト全体を設定
              value={op} 
              className='cursor-pointer p-2 data-focus:bg-blue-500 data-focus:text-white'
            >
              <div className="">{op.label}</div>
            </ComboboxOption>
          )
        ) : (
          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
            一致するオプションはありません
          </div>
        )}
      </ComboboxOptions>
    </Combobox>
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
        <SlashIcon className='size-5' />
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
