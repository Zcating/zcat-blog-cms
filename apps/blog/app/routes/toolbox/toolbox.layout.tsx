import { cn, ZSidebar, type ZSidebarOption } from '@zcat/ui';
import { Link, Outlet } from 'react-router';

import { ToolbarHeader, ToolboxFooter } from '@blog/features';

const items: ZSidebarOption[] = [
  {
    label: '导航',
    value: '/toolbox',
  },
  {
    label: '常用',
    children: [
      {
        label: 'IP 查询',
        value: '/toolbox/ip-lookup',
      },
      {
        label: 'Hash 计算',
        value: '/toolbox/hash',
      },
      {
        label: 'RSA 加解密',
        value: '/toolbox/rsa-crypto',
      },
      {
        label: '图片和 Base64 互转',
        value: '/toolbox/base64-to-image',
      },
      {
        label: '身份证生成',
        value: '/toolbox/id-card-generator',
      },
    ],
  },
];

export default function ToolboxLayout() {
  const classNames = cn(
    'h-full w-full overflow-hidden',
    '[--header-height:calc(--spacing(20))]',
    '[--footer-height:calc(--spacing(10))]',
  );

  const renderItem = (item: ZSidebarOption) => {
    if (item.value) {
      return (
        <Link to={item.value}>
          <span>{item.label}</span>
        </Link>
      );
    }
    return <span>{item.label}</span>;
  };

  return (
    <ZSidebar
      className={classNames}
      options={items}
      renderItem={renderItem}
      header={ToolbarHeader}
      footer={ToolboxFooter}
    >
      <Outlet />
    </ZSidebar>
  );
}
