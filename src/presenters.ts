import { WinPresenter, type WinData } from '@dreams-engine/slot-flow';
import type { IPresenter } from '@dreams-engine/slot-flow';
import type { IMachine } from '@dreams-engine/slot';

type SlotPresenters = {
  win: IPresenter<WinData[], IMachine> & { machine: IMachine | null };
};

function createWinPresenter(): SlotPresenters['win'] {
  let machine: IMachine | null = null;
  let delegate: WinPresenter | null = null;

  const presenter: Partial<SlotPresenters['win']> & {
    present: SlotPresenters['win']['present'];
    cancel: SlotPresenters['win']['cancel'];
  } = {
    async present(wins: WinData[], signal?: AbortSignal) {
      if (!machine) return;
      if (!delegate) {
        delegate = new WinPresenter(machine as any);
      }
      await delegate.present(wins, signal);
    },
    cancel(reason?: string) {
      delegate?.cancel(reason);
    },
  };

  Object.defineProperty(presenter, 'machine', {
    get: () => machine,
    set: (value: IMachine | null) => {
      machine = value;
      delegate = value ? new WinPresenter(value as any) : null;
    },
    enumerable: true,
    configurable: true,
  });

  return presenter as SlotPresenters['win'];
}

export default function createPresenters(): SlotPresenters {
  return {
    win: createWinPresenter(),
  };
}
