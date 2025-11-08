import { exportHomesteadToTownship } from '../homesteadToTownship';
import { defaultState } from '../../../types';

describe('exportHomesteadToTownship', () => {
  it('derives deterministic seed and aggregates structures', () => {
    const state = defaultState();
    state.structures.push({ id: 2, type: 'barn', x: 4, y: 6, footprint: { w: 3, h: 2 } });
    state.homestead.time.day = 7;

    const exportPayload = exportHomesteadToTownship(state);

    expect(exportPayload.version).toBe(1);
    expect(exportPayload.seed).toBe(exportHomesteadToTownship(state).seed);
    expect(exportPayload.homestead.structures).toEqual([
      { type: 'cottage', x: 10, y: 10, width: 2, height: 2 },
      { type: 'barn', x: 4, y: 6, width: 3, height: 2 }
    ]);
  });

  it('coalesces shipments and respects mail attachments when enabled', () => {
    const state = defaultState();
    state.resources.wood = 120;
    state.resources.food = 45;
    state.mail.inbox.push({
      id: 1,
      sender: 'guild',
      subject: 'Care Package',
      body: 'Enjoy',
      attachments: { wood: 5, coins: 12 },
      deliveredAtSeconds: 0,
      read: false
    });

    const exportPayload = exportHomesteadToTownship(state, { includeMailAttachments: true });
    const shipments = exportPayload.township.shipments;
    const shipmentMap = Object.fromEntries(shipments.map((s) => [s.resourceId, s.amount]));

    expect(shipmentMap.wood).toBe(125);
    expect(shipmentMap.coins).toBe(12);
    expect(shipmentMap.food).toBe(45);
  });

  it('omits mail attachments when disabled', () => {
    const state = defaultState();
    state.resources.wood = 40;
    state.mail.inbox.push({
      id: 9,
      sender: 'guild',
      subject: 'Care Package',
      body: 'Enjoy',
      attachments: { wood: 50 },
      deliveredAtSeconds: 0,
      read: false
    });

    const exportPayload = exportHomesteadToTownship(state, { includeMailAttachments: false });
    const shipmentMap = Object.fromEntries(
      exportPayload.township.shipments.map((s) => [s.resourceId, s.amount])
    );

    expect(shipmentMap.wood).toBe(40);
  });

  it('produces agriculture district when structures exist', () => {
    const state = defaultState();
    state.structures.push({ id: 3, type: 'field', x: 2, y: 2, footprint: { w: 4, h: 3 } });
    state.resources.food = 90;

    const payload = exportHomesteadToTownship(state);
    expect(payload.township.agriculture).toHaveLength(1);
    const district = payload.township.agriculture[0];
    expect(district.plots).toBeGreaterThan(0);
    expect(district.exports.length).toBeGreaterThan(0);
  });
});
