import React, { useState } from 'react';
import addressOptions from './address-options.json';
import { ZSelect } from '@z-ui/design/z-select/z-select';
import { useMount, usePropsValue } from '@z-ui/components/hooks';

type DistrictOption = CommonOption<string>;

interface CityOption extends CommonOption<string> {
  children: CommonOption<string>[];
}

interface ProvinceOption extends CommonOption<string> {
  children: CityOption[];
}

const PROVINCE_OPTIONS = addressOptions as ProvinceOption[];

export interface ZAddressProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}

export function ZAddress(props: ZAddressProps) {
  const { value, defaultValue, onValueChange, className, style } = props;

  const [inner, setInner] = usePropsValue({
    value,
    defaultValue,
    onChange: (v) => {
      if (!v || typeof onValueChange !== 'function') {
        return;
      }
      onValueChange(v);
    },
  });

  const [provList, setProvList] = React.useState<ProvinceOption[]>([]);
  const [cityList, setCityList] = React.useState<CityOption[]>([]);
  const [distList, setDistList] = React.useState<DistrictOption[]>([]);

  const [current, setCurrent] = useState({
    provinceCode: '',
    cityCode: '',
    districtCode: '',
  });

  React.useEffect(() => {
    if (current.districtCode === inner) {
      return;
    }
    setInner(current.districtCode);
  }, [current, inner]);

  useMount(() => {
    const firstProvince = PROVINCE_OPTIONS[0];
    if (!firstProvince) {
      return;
    }

    const cityOptions = firstProvince.children;
    if (!cityOptions) {
      return;
    }

    const firstCity = cityOptions[0];
    if (!firstCity) {
      return;
    }

    const distOptions = firstCity.children;
    if (!distOptions) {
      return;
    }

    const firstDist = distOptions[0];
    if (!firstDist) {
      return;
    }

    setProvList(PROVINCE_OPTIONS);
    setCityList(cityOptions);
    setDistList(distOptions);
    setCurrent({
      provinceCode: firstProvince.value,
      cityCode: firstCity.value,
      districtCode: firstDist.value,
    });
  });

  const onProvinceChange = (v: string) => {
    const province = provList.find((item) => item.value === v);
    if (!province) {
      return;
    }
    setCityList(province.children);

    const firstCity = province.children[0];
    if (!firstCity) {
      return;
    }
    setDistList(firstCity.children);

    const firstDist = firstCity.children[0];
    if (!firstDist) {
      return;
    }

    setCurrent({
      provinceCode: v,
      cityCode: firstCity.value,
      districtCode: firstDist.value,
    });
    setInner(firstDist.value);
  };

  const onCityChange = (v: string) => {
    const city = cityList.find((item) => item.value === v);
    if (!city) {
      return;
    }
    setDistList(city.children);

    const firstDist = city.children[0];
    if (!firstDist) {
      return;
    }
    setCurrent((prev) => ({
      ...prev,
      cityCode: v,
      districtCode: firstDist.value,
    }));
    setInner(firstDist.value);
  };

  const onDistrictChange = (v: string) => {
    if (!v) {
      return;
    }
    setCurrent((prev) => ({ ...prev, districtCode: v }));
    setInner(v);
  };

  return (
    <div className={className} style={style}>
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          <ZSelect
            options={provList}
            value={current.provinceCode}
            onValueChange={onProvinceChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <ZSelect
            options={cityList}
            value={current.cityCode}
            onValueChange={onCityChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <ZSelect
            options={distList}
            value={current.districtCode}
            onValueChange={onDistrictChange}
          />
        </div>
      </div>
    </div>
  );
}
