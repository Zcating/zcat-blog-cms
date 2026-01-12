import React, { useState } from 'react';

// import addressOptions from './address-options.json';
import { ZSelect } from '@zcat/ui/design/z-select/z-select';
import { useMount, usePropsValue } from '@zcat/ui/hooks';

import { CommonOption } from '../types';

export interface CascadeOption<T = string> {
  value: T;
  label: string;
  children?: CascadeOption<T>[];
}

export interface ZAddressProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  options?: CascadeOption[];
}

export function ZAddress(props: ZAddressProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    className,
    style,
    options = [],
  } = props;

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

  const [provList, setProvList] = React.useState<CascadeOption[]>([]);
  const [cityList, setCityList] = React.useState<CascadeOption[]>([]);
  const [distList, setDistList] = React.useState<CommonOption[]>([]);

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
    const firstProvince = options[0];
    if (!firstProvince) {
      return;
    }

    const cityOptions = firstProvince.children;
    if (!Array.isArray(cityOptions)) {
      return;
    }

    const firstCity = cityOptions[0];
    if (!firstCity) {
      return;
    }

    const distOptions = firstCity.children;
    if (!Array.isArray(distOptions)) {
      return;
    }

    const firstDist = distOptions[0];
    if (!firstDist) {
      return;
    }

    setProvList(options);
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
    const cities = province?.children;
    if (!Array.isArray(cities)) {
      return;
    }
    setCityList(cities);

    const firstCity = cities[0];
    const dists = firstCity?.children;
    if (!Array.isArray(dists)) {
      return;
    }

    setDistList(dists);

    const firstDist = dists[0];
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
    const dists = city?.children;
    if (!Array.isArray(dists)) {
      return;
    }

    setDistList(dists);

    const firstDist = dists[0];
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
