import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeSvg, getSafeYoutubeEmbedUrl } from '../utils/sanitize';
import { buildRecipePrompt, parseGeminiResponse, parseTipGeminiResponse } from '../utils/geminiParser';
import { normalizeUnit, extractAndNormalizeUnits } from '../utils/unitNormalizer';
import { sanitizeRelativePath } from '../storage/types';

describe('sanitizeHtml & sanitizeSvg', () => {
  it('strips <script>, inline event handlers, and javascript: URIs from HTML', () => {
    const dirty =
      '<p onclick="alert(1)">Hello <script>evil()</script><a href="javascript:alert(2)">Link</a></p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p>Hello ');
  });

  it('preserves safe formatting tags in sanitizeHtml', () => {
    const safe = '<p><strong>Đậm</strong> và <em>nghiêng</em></p><ul><li>Mục 1</li></ul>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('sanitizes SVG while removing script and event attributes', () => {
    const dirtySvg = '<svg viewBox="0 0 24 24" onload="hack()"><script>bad()</script><path d="M0 0h24v24H0z"/></svg>';
    const cleanSvg = sanitizeSvg(dirtySvg);
    expect(cleanSvg).toContain('<svg');
    expect(cleanSvg).toContain('<path');
    expect(cleanSvg).not.toContain('onload');
    expect(cleanSvg).not.toContain('<script');
  });
});

describe('getSafeYoutubeEmbedUrl', () => {
  it('extracts valid 11-char video ID from youtube watch and youtu.be URLs', () => {
    expect(getSafeYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
    expect(getSafeYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('rejects non-YouTube or malicious URLs', () => {
    expect(getSafeYoutubeEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeYoutubeEmbedUrl('https://evil.com/youtube.com/watch?v=123')).toBeNull();
  });
});

describe('sanitizeRelativePath', () => {
  it('normalizes valid relative paths and rejects path traversal', () => {
    expect(sanitizeRelativePath('recipes\\my-dish.json')).toBe('recipes/my-dish.json');
    expect(() => sanitizeRelativePath('../secrets.json')).toThrow(/Invalid relative storage path/);
    expect(() => sanitizeRelativePath('recipes/../../etc/passwd')).toThrow(/Invalid relative storage path/);
    expect(() => sanitizeRelativePath('file\0.json')).toThrow(/Invalid relative storage path/);
  });
});

describe('parseGeminiResponse & parseTipGeminiResponse', () => {
  it('parses markdown-fenced JSON recipe output and sanitizes HTML fields', () => {
    const raw = `\`\`\`json
[
  {
    "title": "Phở Bò",
    "prep_time": 20,
    "cook_time": 120,
    "servings": 4,
    "difficulty": "medium",
    "calories": 550,
    "notes": "<p>Nước dùng trong<script>alert(1)</script></p>",
    "ingredients": [{ "name": "Thịt bò", "quantity": "500", "unit": "g" }],
    "steps": [{ "order": 1, "content": "<p>Chần xương</p>" }]
  }
]
\`\`\``;
    const recipes = parseGeminiResponse(raw);
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Phở Bò');
    expect(recipes[0].notes).toBe('<p>Nước dùng trong</p>');
    expect(recipes[0].stepSections?.[0]?.steps?.[0]?.content).toBe('<p>Chần xương</p>');
  });

  it('parses tip JSON output and sanitizes HTML content', () => {
    const raw = JSON.stringify({
      title: 'Cách bảo quản rau',
      category_id: 'preservation',
      content: '<p onclick="evil()">Bọc giấy báo</p>',
    });
    const tip = parseTipGeminiResponse(raw);
    expect(tip.title).toBe('Cách bảo quản rau');
    expect(tip.category_id).toBe('preservation');
    expect(tip.content).toBe('<p>Bọc giấy báo</p>');
  });

  it('normalizes polluted units ("g nước tương", "mc nước tương", "quả đập dập") and moves prep notes to steps', () => {
    expect(normalizeUnit('g')).toBe('g');
    expect(normalizeUnit('g nước tương')).toBe('g');
    expect(normalizeUnit('mc nước tương')).toBe('muỗng canh');
    expect(normalizeUnit('quả đập dập')).toBe('quả');
    expect(normalizeUnit('đập dập')).toBe('');

    const raw = JSON.stringify({
      recipes: [
        {
          title: 'Gà kho nước tương',
          ingredientSections: [
            {
              name: 'Nguyên liệu chính',
              ingredients: [
                { name: 'Nước tương', amount: '15', unit: 'g nước tương' },
                { name: 'Dầu hào', amount: '2', unit: 'mc nước tương' },
                { name: 'Thảo quả', amount: '1', unit: 'quả đập dập' },
              ],
            },
          ],
          stepSections: [
            {
              name: 'Thực hiện',
              steps: [{ content: '<p>Kho lửa nhỏ.</p>' }],
            },
          ],
        },
      ],
    });

    const recipes = parseGeminiResponse(raw);
    const ings = recipes[0].ingredientSections?.[0]?.ingredients || [];
    expect(ings[0].unit).toBe('g');
    expect(ings[1].unit).toBe('muỗng canh');
    expect(ings[2].unit).toBe('quả');

    const extractedUnits = extractAndNormalizeUnits(recipes);
    expect(extractedUnits).toEqual(['g', 'muỗng canh', 'quả']);

    const firstStepContent = recipes[0].stepSections?.[0]?.steps?.[0]?.content || '';
    expect(firstStepContent).toContain('Thảo quả đập dập');
  });

  it('merges database units with default units in buildRecipePrompt and includes anti-pollution rules', () => {
    const prompt = buildRecipePrompt('Gà kho', [], [], ['khay', 'vắt']);
    expect(prompt).toContain('khay');
    expect(prompt).toContain('vắt');
    expect(prompt).toContain('muỗng canh');
    expect(prompt).toContain('g nước tương');
    expect(prompt).toContain('mc nước tương');
    expect(prompt).toContain('quả đập dập');
  });
});

