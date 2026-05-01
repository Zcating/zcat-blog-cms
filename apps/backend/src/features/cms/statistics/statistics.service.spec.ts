import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let statisticService: {
    getStatistics: ReturnType<typeof vi.fn>;
    getSummary: ReturnType<typeof vi.fn>;
    getChartData: ReturnType<typeof vi.fn>;
  };
  let service: StatisticsService;

  beforeEach(() => {
    statisticService = {
      getStatistics: vi.fn(),
      getSummary: vi.fn(),
      getChartData: vi.fn(),
    };
    service = new StatisticsService(statisticService as any);
  });

  it('getStatistics forwards query with default page and limit', async () => {
    statisticService.getStatistics.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });

    await service.getStatistics({ pagePath: '/home' } as any);

    expect(statisticService.getStatistics).toHaveBeenCalledWith(
      {
        pagePath: '/home',
        ip: undefined,
        browser: undefined,
        os: undefined,
        device: undefined,
      },
      1,
      10,
    );
  });

  it('getSummary proxies statistic service result', async () => {
    statisticService.getSummary.mockResolvedValue({ totalVisits: 123 });

    const result = await service.getSummary();

    expect(statisticService.getSummary).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalVisits: 123 });
  });

  it('getChartData falls back to 7 days for invalid input', async () => {
    statisticService.getChartData.mockResolvedValue([]);

    await service.getChartData('not-a-number');

    expect(statisticService.getChartData).toHaveBeenCalledWith(7);
  });

  it('getChartData parses days string to number', async () => {
    statisticService.getChartData.mockResolvedValue([]);

    await service.getChartData('30');

    expect(statisticService.getChartData).toHaveBeenCalledWith(30);
  });
});
