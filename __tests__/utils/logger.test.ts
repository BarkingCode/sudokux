import { logger, createScopedLogger } from '../../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('in __DEV__ mode', () => {
    it('debug logs with scope and message', () => {
      logger.debug('Test', 'hello');
      expect(console.log).toHaveBeenCalledWith('[Test] hello');
    });

    it('debug logs with data', () => {
      const data = { key: 'value' };
      logger.debug('Test', 'hello', data);
      expect(console.log).toHaveBeenCalledWith('[Test] hello', data);
    });

    it('info logs with console.info', () => {
      logger.info('Scope', 'msg');
      expect(console.info).toHaveBeenCalledWith('[Scope] msg');
    });

    it('info logs with data', () => {
      logger.info('Scope', 'msg', { x: 1 });
      expect(console.info).toHaveBeenCalledWith('[Scope] msg', { x: 1 });
    });

    it('warn logs with console.warn', () => {
      logger.warn('Scope', 'warning');
      expect(console.warn).toHaveBeenCalledWith('[Scope] warning');
    });

    it('warn logs with data', () => {
      logger.warn('Scope', 'warning', { err: true });
      expect(console.warn).toHaveBeenCalledWith('[Scope] warning', { err: true });
    });

    it('error logs with console.error', () => {
      logger.error('Scope', 'failure');
      expect(console.error).toHaveBeenCalledWith('[Scope] failure');
    });

    it('error logs with data', () => {
      logger.error('Scope', 'failure', { code: 500 });
      expect(console.error).toHaveBeenCalledWith('[Scope] failure', { code: 500 });
    });
  });

  describe('createScopedLogger', () => {
    it('creates a logger with fixed scope', () => {
      const log = createScopedLogger('MyModule');
      log.debug('test message');
      expect(console.log).toHaveBeenCalledWith('[MyModule] test message');
    });

    it('passes data through', () => {
      const log = createScopedLogger('MyModule');
      log.info('info', { a: 1 });
      expect(console.info).toHaveBeenCalledWith('[MyModule] info', { a: 1 });
    });

    it('supports all log levels', () => {
      const log = createScopedLogger('X');
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      expect(console.log).toHaveBeenCalledWith('[X] d');
      expect(console.info).toHaveBeenCalledWith('[X] i');
      expect(console.warn).toHaveBeenCalledWith('[X] w');
      expect(console.error).toHaveBeenCalledWith('[X] e');
    });
  });
});
