import { Test, TestingModule } from '@nestjs/testing';
import { ProPanelHandlerController } from './pro-panel_handler.controller';
import { ProPanelHandlerService } from './pro-panel_handler.service';

describe('ProPanelHandlerController', () => {
  let controller: ProPanelHandlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProPanelHandlerController],
      providers: [ProPanelHandlerService],
    }).compile();

    controller = module.get<ProPanelHandlerController>(ProPanelHandlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
