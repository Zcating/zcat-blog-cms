import { expect, test } from '@playwright/test';

/**
 * Dashboard gate for the client-side read path.
 *
 * Submitting the login form is a client-side router navigation, so
 * `/dashboard` renders without an SSR pass. Every panel must
 * therefore resolve through the `statisticsSummaryOptions` /
 * `statisticsChartDataOptions` Query slots, whose `queryFn`s have to
 * call the protected server functions. If a `queryFn` calls the raw
 * transport helper instead, that helper runs in the browser, where
 * `liveCookieIO()` throws `liveCookieIO can only be called on the
 * server`, and the router renders its default error component
 * ("Something went wrong!") instead of the dashboard.
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('http://127.0.0.1:9090/api/test/reset');
  });

  test('renders every panel after a client-side login navigation', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const content = page.locator('#cms-layout-content');
    await expect(content.getByText('仪表盘')).toBeVisible();
    await expect(content.getByText('总访问量')).toBeVisible();
    await expect(content.getByText('独立访客')).toBeVisible();
    await expect(content.getByText('今日访问')).toBeVisible();
    await expect(content.getByText('今日访客')).toBeVisible();
    await expect(content.getByText('访问趋势（最近7天）')).toBeVisible();
    await expect(content.getByText('热门页面（最近7天）')).toBeVisible();
    await expect(page.getByText('Something went wrong!')).toHaveCount(0);
  });
});
