import FingerprintJS from '@fingerprintjs/fingerprintjs';
import CryptoJSW from '@originjs/crypto-js-wasm';

import { HttpClient } from '../http/http-client';

let md5Loaded = false;

export namespace StatisticsApi {
  // 博客访客记录DTO
  export interface BlogVisitorDto {
    pagePath?: string;
    pageTitle?: string;
    referrer?: string;
    browser?: string;
    os?: string;
    device?: string;
    deviceId?: string;
  }

  /**
   * 自动记录页面访问
   * @param pagePath 页面路径
   * @param pageTitle 页面标题
   */
  export async function uploadVisitRecord(
    pagePath: string = '',
    pageTitle: string = '',
  ): Promise<void> {
    try {
      // 获取浏览器信息和设备ID
      const browserInfo = getBrowserInfo();
      const deviceId = await generateDeviceId();

      const params = {
        pagePath: pagePath,
        pageTitle: pageTitle,
        referrer: document.referrer || '',
        browser: browserInfo.browser,
        os: browserInfo.os,
        device: browserInfo.device,
        deviceId: deviceId,
      } as Record<string, string>;

      const serializedParams = Object.keys(params)
        .sort((a, b) => (a > b ? 1 : -1))
        .map((item) => `${item}=${params[item]}`)
        .join('&');

      if (!md5Loaded) {
        await CryptoJSW.MD5.loadWasm();
        md5Loaded = true;
      }

      await HttpClient.post('blog/visitor', params, {
        'Data-Hash': CryptoJSW.MD5(serializedParams).toString(),
      });
    } catch (error) {
      console.warn('Failed to auto record visit:', error);
    }
  }

  /**
   * 生成设备ID
   */
  export async function generateDeviceId(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }

  /**
   * 获取浏览器信息
   */
  export function getBrowserInfo() {
    const userAgent = navigator.userAgent;

    // 更精确的浏览器检测
    let browser = 'Unknown';
    let browserVersion = '';

    // 检测浏览器类型和版本
    if (userAgent.includes('Edg/')) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Firefox/')) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
      browser = 'Opera';
      const match = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    }

    // 更精确的操作系统检测
    let os = '';
    let osVersion = '';

    if (userAgent.includes('Windows NT')) {
      os = 'Windows';
      const match = userAgent.match(/Windows NT ([0-9.]+)/);
      if (match) {
        const version = match[1];
        switch (version) {
          case '10.0':
            osVersion = '10/11';
            break;
          case '6.3':
            osVersion = '8.1';
            break;
          case '6.2':
            osVersion = '8';
            break;
          case '6.1':
            osVersion = '7';
            break;
          default:
            osVersion = version;
        }
      }
    } else if (userAgent.includes('Mac OS X')) {
      os = 'macOS';
      const match = userAgent.match(/Mac OS X ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('iPhone OS')) {
      os = 'iOS';
      const match = userAgent.match(/iPhone OS ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('iPad')) {
      os = 'iPadOS';
      const match = userAgent.match(/OS ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
      const match = userAgent.match(/Android ([0-9.]+)/);
      osVersion = match ? match[1] : '';
    }

    // 更精确的设备类型检测
    let device = 'Desktop';

    if (userAgent.includes('iPad')) {
      device = 'Tablet';
    } else if (/iPhone|iPod/.test(userAgent)) {
      device = 'Mobile';
    } else if (userAgent.includes('Android')) {
      if (userAgent.includes('Mobile')) {
        device = 'Mobile';
      } else {
        device = 'Tablet';
      }
    } else if (/Mobi|Mobile/.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet/.test(userAgent)) {
      device = 'Tablet';
    }

    // 检测屏幕尺寸作为辅助判断
    if (typeof window !== 'undefined' && window.screen) {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const maxDimension = Math.max(screenWidth, screenHeight);

      // 如果设备类型还是未知，根据屏幕尺寸判断
      if (device === 'Desktop' && maxDimension < 768) {
        device = 'Mobile';
      } else if (device === 'Desktop' && maxDimension < 1024) {
        device = 'Tablet';
      }
    }

    return {
      browser: browserVersion ? `${browser} ${browserVersion}` : browser,
      os: os,
      osVersion: osVersion,
      device,
    };
  }
}
