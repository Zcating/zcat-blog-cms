import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  isObject,
  Skeleton,
  ZTextarea,
  ZView,
} from '@zcat/ui';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function meta() {
  return [
    { title: 'IP 查询' },
    {
      name: 'description',
      content: '查询当前网络 IP 地址及归属地信息',
    },
  ];
}

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  asn?: string;
  timezone?: string;
  [key: string]: any;
}

export default function IpLookupPage() {
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [ipCopied, setIpCopied] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [uaCopied, setUaCopied] = useState(false);

  const fetchIp = async () => {
    setLoading(true);
    setError('');
    try {
      // 使用 ipapi.co 获取详细信息，支持 HTTPS
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) {
        throw new Error('获取 IP 信息失败');
      }
      const data = await res.json();
      if (isObject<Record<string, any>>(data) && data.error) {
        throw new Error(data.reason || '获取 IP 信息失败');
      }
      setInfo(data);
    } catch (err) {
      // Fallback: 尝试仅获取 IP
      try {
        const res2 = await fetch('https://api.ipify.org?format=json');
        const data2 = (await res2.json()) as { ip: string };
        setInfo({ ip: data2.ip });
        setError('获取详细地理位置失败，仅显示 IP');
      } catch (err2) {
        setError('无法连接到 IP 查询服务');
      }
    } finally {
      await Promise.tick(2000);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIp();
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setUserAgent(navigator.userAgent || '');
  }, []);

  const handleCopyIp = () => {
    if (info?.ip) {
      navigator.clipboard.writeText(info.ip);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    }
  };

  const handleCopyUa = () => {
    if (userAgent) {
      navigator.clipboard.writeText(userAgent);
      setUaCopied(true);
      setTimeout(() => setUaCopied(false), 2000);
    }
  };

  const handleResetUa = () => {
    if (typeof navigator === 'undefined') return;
    setUserAgent(navigator.userAgent || '');
  };

  return (
    <ZView className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">IP 查询</h1>
        <p className="text-sm text-muted-foreground">
          查看您的公网 IP 地址及地理位置信息。
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">我的 IP 信息</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchIp}
            disabled={loading}
            title="刷新"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">
                IP 地址
              </p>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Skeleton className="h-9 w-40" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">
                    {info?.ip || '--'}
                  </p>
                )}
                {!loading && info?.ip && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyIp}
                  >
                    {ipCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium leading-none text-muted-foreground">
                UserAgent
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleResetUa}
                  title="使用当前 UA"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyUa}
                  disabled={!userAgent}
                  title="复制"
                >
                  {uaCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <ZTextarea
              value={userAgent}
              onValueChange={setUserAgent}
              rows={4}
              className="text-sm"
              placeholder="未获取到 UserAgent"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ) : (
            info && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {info.country_name && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      国家/地区
                    </span>
                    <span className="font-medium">{info.country_name}</span>
                  </div>
                )}
                {info.region && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      省份/区域
                    </span>
                    <span className="font-medium">{info.region}</span>
                  </div>
                )}
                {info.city && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">城市</span>
                    <span className="font-medium">{info.city}</span>
                  </div>
                )}
                {info.org && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      运营商/组织
                    </span>
                    <span className="font-medium">{info.org}</span>
                  </div>
                )}
                {info.timezone && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">时区</span>
                    <span className="font-medium">{info.timezone}</span>
                  </div>
                )}
              </div>
            )
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ZView>
  );
}
