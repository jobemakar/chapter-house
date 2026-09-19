import type { Level } from './domain';
import nightGardenUrl from "./assets/night-garden.webp";
import lanternwingUrl from "./assets/lanternwing.webp";
const REWARD_IMAGES: Record<string, string> = { "night-garden": nightGardenUrl, lanternwing: lanternwingUrl };

interface RecordDetail {
  catalog: string;
  artDescription: string;
  introduction: string;
  notesTitle: string;
  notes: readonly { label: string; text: string }[];
}

/** Presentation only: ownership and progression remain in ProgressStore. */
export class RewardCards {
  private static readonly details: Record<string, RecordDetail> = {
    'night-garden': {
      catalog: 'CASE · 001',
      artDescription: 'A magical garden of silver flowers blooming beneath moonlight.',
      introduction: 'A quiet garden wakes when moonlight touches its silver flowers.',
      notesTitle: 'Case notes',
      notes: [
        { label: 'Observed', text: 'Silver petals open beneath the moon, then fold away with the first light.' },
        { label: 'Unexplained', text: 'The paths hold no footprints. Nothing disturbs the flowers while they bloom.' },
      ],
    },
    lanternwing: {
      catalog: 'CRYPTID · 002',
      artDescription: 'Lanternwing, a gentle mothlike creature with softly glowing wings.',
      introduction: 'A gentle mothlike creature carries a little light through the dark.',
      notesTitle: 'Field notes',
      notes: [
        { label: 'Appearance', text: 'Broad, softly glowing wings shine like a lantern in the night.' },
        { label: 'Behavior', text: 'It guides lost travelers home, keeping a gentle light just ahead of them.' },
      ],
    },
  };

  static render(level: Level): string {
    const reward = level.reward;
    const detail = this.details[reward.id];
    const escape = (text: string): string => this.escape(text);
    // Retain a readable record if a future discovery has not received its art yet.
    const image = REWARD_IMAGES[reward.id];
    const artwork = image
      ? `<figure class="bureau-record__art"><img src="${escape(image)}" alt="${escape(detail?.artDescription ?? reward.name)}" draggable="false" decoding="async"></figure>`
      : '';
    const notes = detail ? `<section class="bureau-record__notes" aria-label="${escape(detail.notesTitle)}">
      <h4>${escape(detail.notesTitle)}</h4>
      <dl>${detail.notes.map(note => `<div><dt>${escape(note.label)}</dt><dd>${escape(note.text)}</dd></div>`).join('')}</dl>
    </section>` : '';

    return `<article class="bureau-record" data-discovery="${escape(reward.id)}" aria-label="${escape(reward.name)} — ${escape(reward.kind)}">
      <header class="bureau-record__header"><span>${escape(reward.kind)}</span><span class="bureau-record__catalog">${escape(detail?.catalog ?? `RECORD · ${level.id + 1}`)}</span></header>
      ${artwork}
      <div class="bureau-record__body">
        <h3 class="bureau-record__title">${escape(reward.name)}</h3>
        <p class="bureau-record__introduction">${escape(detail?.introduction ?? reward.description)}</p>
        ${notes}
      </div>
      <footer class="bureau-record__footer"><span class="bureau-record__stamp">Catalogued</span><span>Original Bureau discovery</span></footer>
    </article>`;
  }

  private static escape(text: string): string {
    return text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  }
}
