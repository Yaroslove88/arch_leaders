import { Test, TestingModule } from '@nestjs/testing';
import { EntriesService } from './entries.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EntriesService', () => {
  let service: EntriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    entry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return entries with pagination', async () => {
      const mockEntries = [
        { id: '1', type: 'situation', text: 'Test entry', created_at: new Date() },
      ];
      mockPrismaService.entry.findMany.mockResolvedValue(mockEntries);
      mockPrismaService.entry.count.mockResolvedValue(1);

      const result = await service.getAll({ limit: 10, offset: 0 });

      expect(result.entries).toEqual(mockEntries);
      expect(result.total).toBe(1);
      expect(mockPrismaService.entry.findMany).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      mockPrismaService.entry.findMany.mockResolvedValue([]);
      mockPrismaService.entry.count.mockResolvedValue(0);

      await service.getAll({ type: 'situation' });

      expect(mockPrismaService.entry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'situation' },
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return entry by id', async () => {
      const mockEntry = { id: '1', type: 'situation', text: 'Test' };
      mockPrismaService.entry.findUnique.mockResolvedValue(mockEntry);

      const result = await service.getById('1');

      expect(result).toEqual(mockEntry);
      expect(mockPrismaService.entry.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { session: true },
      });
    });
  });

  describe('create', () => {
    it('should create new entry', async () => {
      const createData = {
        type: 'situation',
        source: 'web',
        text: 'New entry',
      };
      const mockCreated = { id: '1', ...createData, created_at: new Date() };
      mockPrismaService.entry.create.mockResolvedValue(mockCreated);

      const result = await service.create(createData);

      expect(result).toEqual(mockCreated);
      expect(mockPrismaService.entry.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createData),
      });
    });
  });
});

