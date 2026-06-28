import { Test, TestingModule } from '@nestjs/testing';
import { ProPanelHandlerService } from './pro-panel_handler.service';

describe('ProPanelHandlerService', () => {
  let service: ProPanelHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProPanelHandlerService],
    }).compile();

    service = module.get<ProPanelHandlerService>(ProPanelHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
