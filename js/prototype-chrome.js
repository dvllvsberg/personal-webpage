/* Prototype side chrome — bruteforce digits + command line */

(function () {
  const HEX = '0123456789ABCDEF';
  const DIGITS = '0123456789';

  function bruteforceElements(selector, charset, minMs, maxMs, chance) {
    document.querySelectorAll(selector).forEach((el) => {
      const tick = () => {
        if (Math.random() < chance) {
          el.textContent = charset[Math.floor(Math.random() * charset.length)];
        }
        setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
      };
      tick();
    });
  }

  function initReadoutBruteforce() {
    bruteforceElements('.proto-brute-digit', DIGITS, 220, 750, 0.55);
  }

  function initRulerBruteforce() {
    document.querySelectorAll('.proto-brute-ruler').forEach((el) => {
      const base = el.dataset.base || el.textContent;
      const tick = () => {
        if (Math.random() < 0.18) {
          const n = parseInt(base, 10);
          const delta = Math.floor(Math.random() * 5) - 2;
          el.textContent = String(Math.max(0, n + delta)).padStart(3, '0');
        } else if (Math.random() < 0.06) {
          el.textContent = HEX[Math.floor(Math.random() * 16)]
            + HEX[Math.floor(Math.random() * 16)]
            + HEX[Math.floor(Math.random() * 16)];
        } else {
          el.textContent = base;
        }
        setTimeout(tick, 1400 + Math.random() * 2800);
      };
      tick();
    });
  }

  const CMD_POOL = [
    '> init blackwatch protocol',
    '> sector 7 scan...',
    '> 0xDEADBEEF detected',
    '> threat_level: CRITICAL',
    '> quarantine_armed=true',
    '> decrypt object... FAIL',
    '> retry handshake [##----] 34%',
    '> memory leak @ 0x7FF8',
    '> BLACKLIGHT trace active',
    '> host integrity: UNKNOWN',
    '> override denied',
    '> pathogen signature match',
    '> WELCOME TO HELL v2.0',
    '> consumer [REDACTED]',
    '> inbound connection blocked',
    '> purge cache... ok',
    '> sync dna registry...',
    '> ERR: NO ESCAPE',
    '> loading nightmare...',
    '> RLS policy: enforced',
    '> auth.uid() verified',
    '>',
    '> ████████████░░ 91%',
    '> bruteforce key...',
    '> 4A 6F 73 68 75 61',
    '> strand delta +0.003',
    '> consume // adapt // survive',
  ];

  const CMD_GLYPHS = '█░▓▒<>/\\|[]{}01xABCDEF!@#';
  const MAX_LINES = 36;

  function randomGlitchLine() {
    let s = '> ';
    const len = 6 + Math.floor(Math.random() * 14);
    for (let i = 0; i < len; i++) {
      s += CMD_GLYPHS[Math.floor(Math.random() * CMD_GLYPHS.length)];
    }
    return s;
  }

  function initCommandLine() {
    const inner = document.getElementById('proto-cmdline-inner');
    if (!inner) return;

    const lines = [];
    let poolIdx = 0;

    function pushLine(text) {
      lines.push(text);
      if (lines.length > MAX_LINES) lines.shift();

      const line = document.createElement('div');
      line.className = 'proto-cmdline-line';
      line.textContent = text;
      inner.appendChild(line);

      while (inner.children.length > MAX_LINES) {
        inner.removeChild(inner.firstChild);
        lines.shift();
      }
    }

    const addLine = () => {
      if (Math.random() < 0.25) {
        pushLine(randomGlitchLine());
      } else {
        pushLine(CMD_POOL[poolIdx % CMD_POOL.length]);
        poolIdx++;
      }
      setTimeout(addLine, 900 + Math.random() * 2200);
    };

    pushLine('> system boot...');
    pushLine('> blackwatch // online');
    setTimeout(addLine, 500);

    setInterval(() => {
      if (Math.random() < 0.35 && lines.length) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.startsWith('>') && lastLine.length > 4) {
          const chars = lastLine.split('');
          const pos = 2 + Math.floor(Math.random() * (chars.length - 2));
          chars[pos] = CMD_GLYPHS[Math.floor(Math.random() * CMD_GLYPHS.length)];
          lines[lines.length - 1] = chars.join('');
          const lastEl = inner.lastElementChild;
          if (lastEl) lastEl.textContent = lines[lines.length - 1];
        }
      }
    }, 180);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReadoutBruteforce();
    initRulerBruteforce();
    initCommandLine();
  });
})();
