import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionProgress } from '../src/lib/collection-progress.js';
afterEach(() => {
  vi.useRealTimers();
});

describe('progression de collecte GitHub', () => {
  it('attend le total connu puis estime les issues restantes et réinitialise le débit après une pause', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const progress = new CollectionProgress(2, { isTTY: true, columns: 200, write });
    progress.addIssues(6);
    vi.advanceTimersByTime(3000);
    for (let i = 0; i < 3; i++) progress.issueCompleted();
    expect(write.mock.calls.at(-1)?.[0]).toContain('reste : indisponible');
    progress.addIssues(6);
    expect(write.mock.calls.at(-1)?.[0]).toContain('reste ≈ 9 s');
    progress.setQuotaPaused('rest', true);
    progress.setQuotaPaused('graphql', true);
    vi.advanceTimersByTime(3600000);
    progress.setQuotaPaused('rest', false);
    expect(write.mock.calls.at(-1)?.[0]).toContain('reste : indisponible');
    progress.setQuotaPaused('graphql', false);
    vi.advanceTimersByTime(3000);
    for (let i = 0; i < 3; i++) progress.issueCompleted();
    expect(write.mock.calls.at(-1)?.[0]).toContain('reste ≈ 6 s');
  });
  it('actualise une seule ligne et termine avec une nouvelle ligne', () => {
    const write = vi.fn();
    const progress = new CollectionProgress(2, { isTTY: true, columns: 140, write });
    progress.addIssues(3);
    progress.issueCompleted();
    progress.updateQuota(4998, 2);
    progress.repositoryCompleted();
    const updates = write.mock.calls.map(([text]) => String(text));
    expect(updates.every((text) => text.startsWith('\r\x1b[2K') && !text.includes('\n'))).toBe(true);
    expect(updates.at(-1)).toContain('repos 1/2 | issues 1/3');
    expect(updates.at(-1)).toContain('quota GraphQL 4998');
    progress.finish(true);
    expect(write.mock.calls.at(-1)?.[0]).toContain('terminée : 1/2');
    expect(write.mock.calls.at(-1)?.[0]).toMatch(/\n$/);
  });
  it('reste sobre sans terminal et conserve les avertissements', () => {
    const write = vi.fn();
    const progress = new CollectionProgress(1, { isTTY: false, write });
    for (let index = 0; index < 100; index++) progress.updateQuota(5000 - index, 1);
    progress.addIssues(2);
    progress.issueCompleted();
    expect(write).toHaveBeenCalledTimes(1);
    progress.warn('Limite API atteinte');
    progress.finish(false);
    expect(write).toHaveBeenCalledTimes(3);
    expect(write.mock.calls.at(-1)?.[0]).toContain('interrompue');
    expect(write.mock.calls.map(([text]) => text).join('')).not.toContain('\x1b');
    const count = write.mock.calls.length;
    progress.updateQuota(0, 1);
    progress.issueCompleted();
    progress.repositoryCompleted();
    progress.finish(true);
    expect(write).toHaveBeenCalledTimes(count);
  });
  it('efface la ligne avant un avertissement et limite sa largeur', () => {
    const write = vi.fn();
    const progress = new CollectionProgress(1, { isTTY: true, columns: 32, write });
    progress.updateQuota(4321, 1);
    expect(String(write.mock.calls.at(-1)?.[0]).replace('\r\x1b[2K', '').length).toBeLessThan(32);
    progress.warn('Avertissement');
    expect(write.mock.calls.at(-3)?.[0]).toBe('\r\x1b[2K');
    expect(write.mock.calls.at(-2)?.[0]).toBe('Avertissement\n');
    expect(write.mock.calls.at(-1)?.[0]).toContain('GitHub');
    progress.finish(false);
  });
});
