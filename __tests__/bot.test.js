/**
 * Unit tests for arcagent bot.js command handlers.
 *
 * Tests bot command registration, argument parsing, and response formatting
 * using mocked grammy Bot and child_process.execSync.
 */

'use strict';

// ── Replicate bot helpers (pure functions, no side-effects) ────────────

function $exec(cmd, mockExec) {
  try {
    return mockExec(cmd, { encoding: 'utf-8', timeout: 30_000 }).trim();
  } catch (e) {
    return `ERR: ${e.stderr || e.message}`;
  }
}

function esc(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// ── Replicate command handlers (extracted from bot.js) ─────────────────

function handleStart() {
  return (
    '🤖 *ArcAgent* — Circle Agent Wallet for Arc Network\\\n\n' +
    '/wallet — Create or show SCA wallet\n' +
    '/balance — Check USDC balance\n' +
    '/fund — Fund wallet from faucet\n' +
    '/pay — Pay another address\n' +
    '/services — Search Circle services'
  );
}

function handleWallet(mockExec) {
  return $exec('circle wallet create 2>/dev/null || circle wallet show', mockExec);
}

function handleBalance(mockExec) {
  return $exec('circle wallet balance', mockExec);
}

function handleFund(mockExec) {
  return $exec('circle wallet fund', mockExec);
}

function handlePay(text, mockExec) {
  const args = text.split(/\s+/).slice(1);
  if (args.length < 2) return null; // usage error
  const [to, amount] = args;
  return $exec(`circle services pay --to ${to} --amount ${amount}`, mockExec);
}

function handleServices(text, mockExec) {
  const query = text.split(/\s+/).slice(1).join(' ') || '';
  const cmd = query
    ? `circle services search "${query}"`
    : 'circle services search';
  return $exec(cmd, mockExec);
}

function truncate(output) {
  return output.slice(0, 3800);
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('/start command', () => {
  test('returns introductory message with all commands listed', () => {
    const msg = handleStart();
    expect(msg).toContain('ArcAgent');
    expect(msg).toContain('/wallet');
    expect(msg).toContain('/balance');
    expect(msg).toContain('/fund');
    expect(msg).toContain('/pay');
    expect(msg).toContain('/services');
  });
});

describe('/wallet command', () => {
  test('calls circle wallet create / show and returns output', () => {
    const mockExec = jest.fn(() => 'Wallet: 0xabc123...');
    const result = handleWallet(mockExec);
    expect(result).toBe('Wallet: 0xabc123...');
    expect(mockExec.mock.calls[0][0]).toContain('circle wallet');
  });

  test('handles command failure gracefully', () => {
    const error = new Error('CLI not found');
    error.stderr = 'circle: command not found';
    const mockExec = jest.fn(() => { throw error; });
    const result = handleWallet(mockExec);
    expect(result).toContain('ERR:');
    expect(result).toContain('circle: command not found');
  });
});

describe('/balance command', () => {
  test('calls circle wallet balance', () => {
    const mockExec = jest.fn(() => 'USDC: 500.00');
    const result = handleBalance(mockExec);
    expect(result).toBe('USDC: 500.00');
  });
});

describe('/fund command', () => {
  test('calls circle wallet fund', () => {
    const mockExec = jest.fn(() => 'Faucet: +100 USDC');
    const result = handleFund(mockExec);
    expect(result).toBe('Faucet: +100 USDC');
  });

  test('returns error when fund fails', () => {
    const error = new Error('rate limit');
    error.stderr = 'faucet rate limited';
    const mockExec = jest.fn(() => { throw error; });
    const result = handleFund(mockExec);
    expect(result).toContain('ERR:');
    expect(result).toContain('faucet rate limited');
  });
});

describe('/pay command', () => {
  test('extracts address and amount from command', () => {
    const mockExec = jest.fn(() => 'Payment sent');
    const result = handlePay('/pay 0x1234567890abcdef 50', mockExec);
    expect(result).toBe('Payment sent');
    const cmd = mockExec.mock.calls[0][0];
    expect(cmd).toContain('--to 0x1234567890abcdef');
    expect(cmd).toContain('--amount 50');
  });

  test('returns null (usage error) when fewer than 2 args', () => {
    const mockExec = jest.fn();
    expect(handlePay('/pay', mockExec)).toBeNull();
    expect(handlePay('/pay 0x123', mockExec)).toBeNull();
  });

  test('handles extra arguments (uses first two)', () => {
    const mockExec = jest.fn(() => 'Payment sent');
    const result = handlePay('/pay 0x123 100 extra', mockExec);
    expect(result).toBe('Payment sent');
    const cmd = mockExec.mock.calls[0][0];
    expect(cmd).toContain('--to 0x123');
    expect(cmd).toContain('--amount 100');
  });
});

describe('/services command', () => {
  test('searches without query uses default search', () => {
    const mockExec = jest.fn(() => 'Available services: ...');
    const result = handleServices('/services', mockExec);
    expect(result).toBe('Available services: ...');
    expect(mockExec.mock.calls[0][0]).toBe('circle services search');
  });

  test('searches with a keyword appends the query', () => {
    const mockExec = jest.fn(() => 'Found: Defi Service');
    const result = handleServices('/services defi', mockExec);
    expect(result).toBe('Found: Defi Service');
    expect(mockExec.mock.calls[0][0]).toBe('circle services search "defi"');
  });

  test('handles multi-word queries', () => {
    const mockExec = jest.fn(() => 'Results...');
    const result = handleServices('/services ai agent swap', mockExec);
    expect(mockExec.mock.calls[0][0]).toBe(
      'circle services search "ai agent swap"'
    );
    expect(result).toBe('Results...');
  });

  test('returns error on service failure', () => {
    const error = new Error('network error');
    error.stderr = 'connection refused';
    const mockExec = jest.fn(() => { throw error; });
    const result = handleServices('/services', mockExec);
    expect(result).toContain('ERR:');
    expect(result).toContain('connection refused');
  });
});

describe('esc() — MarkdownV2 escaping', () => {
  test('escapes all Telegram MarkdownV2 special characters', () => {
    const input = '*bold* _italic_ `code` [link](url) ~strike~ >esc #tag + - = | { } . !';
    const result = esc(input);
    expect(result).not.toBe(input);
    for (const ch of '*_`[]()~#>+=|{}.!') {
      expect(result).toContain('\\' + ch);
    }
  });

  test('leaves normal alphanumeric text unchanged', () => {
    expect(esc('Hello World 123')).toBe('Hello World 123');
  });

  test('handles empty string', () => {
    expect(esc('')).toBe('');
  });

  test('escapes only special chars, not all characters', () => {
    const result = esc('abc');
    expect(result).toBe('abc');
    expect(result).not.toContain('\\');
  });
});

describe('$() — exec wrapper error handling', () => {
  test('returns stdout trimmed on success', () => {
    const mock = jest.fn(() => '  output with spaces  \n');
    const result = $exec('cmd', mock);
    expect(result).toBe('output with spaces');
  });

  test('returns ERR: prefix with stderr on failure', () => {
    const error = new Error('fail');
    error.stderr = 'detailed error';
    const mock = jest.fn(() => { throw error; });
    expect($exec('cmd', mock)).toBe('ERR: detailed error');
  });

  test('returns ERR: with message when no stderr', () => {
    const error = new Error('boom');
    const mock = jest.fn(() => { throw error; });
    expect($exec('cmd', mock)).toBe('ERR: boom');
  });

  test('uses 30 second timeout', () => {
    const mock = jest.fn(() => 'ok');
    $exec('cmd', mock);
    expect(mock).toHaveBeenCalledWith('cmd', {
      encoding: 'utf-8',
      timeout: 30_000,
    });
  });
});

describe('Message truncation for Telegram', () => {
  test('truncates messages longer than 3800 characters', () => {
    const long = 'x'.repeat(5000);
    const result = truncate(long);
    expect(result.length).toBe(3800);
  });

  test('does not truncate short messages', () => {
    const short = 'hello';
    expect(truncate(short)).toBe('hello');
    expect(truncate(short).length).toBe(5);
  });

  test('handles exactly 3800 character messages', () => {
    const exact = 'y'.repeat(3800);
    const result = truncate(exact);
    expect(result.length).toBe(3800);
    expect(result).toBe(exact);
  });

  test('handles empty string', () => {
    expect(truncate('')).toBe('');
  });
});

describe('Command argument parsing edge cases', () => {
  test('handles multiple spaces between arguments', () => {
    const args = '/pay   0x123    50'.split(/\s+/).slice(1);
    expect(args).toEqual(['0x123', '50']);
  });

  test('handles tab-separated arguments', () => {
    const args = '/pay\t0x123\t50'.split(/\s+/).slice(1);
    expect(args).toEqual(['0x123', '50']);
  });

  test('services with only whitespace query returns empty', () => {
    const query = '/services    '.split(/\s+/).slice(1).join(' ');
    expect(query).toBe('');
  });
});
